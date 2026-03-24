from __future__ import annotations

import json
import logging
from collections.abc import AsyncIterator, Iterable
from typing import Any

from litellm import acompletion
from pydantic import ValidationError

from compiler import FrameCompiler
from design_lint import DesignLint
from intent_compiler import IntentFrameCompiler
from intent_plan import INTENT_PLAN_ADAPTER, IntentPlan
from layout_policy import LayoutPolicyEngine
from models import (
    A2UIFrame,
    AddTextDelta,
    DataMapEntry,
    DELTA_ADAPTER,
    FinalizeDelta,
    InitSurfaceDelta,
    SKELETON_DELTA_ADAPTER,
)
from planning_stream import PlanningDeltaRecord, PlanningDeltaStreamParser
from prompting import build_messages
from skeleton_compiler import SkeletonCompiler
from settings import settings

logger = logging.getLogger(__name__)

STREAM_STATUS_TEXT_ID = 'loading_status_text'
STREAM_PREVIEW_TEXT_ID = 'loading_preview_text'
STREAM_METRICS_TEXT_ID = 'loading_metrics_text'


def _truncate(value: Any) -> str:
  text = value if isinstance(value, str) else json.dumps(value, ensure_ascii=False)
  return text[: settings.max_log_chars]


def _strip_code_fences(text: str) -> str:
  stripped = text.strip()
  if stripped.startswith('```') and stripped.endswith('```'):
    lines = stripped.splitlines()
    if len(lines) >= 3:
      return '\n'.join(lines[1:-1]).strip()
  return stripped


def _extract_json_object(text: str) -> str:
  stripped = text.strip()
  start = stripped.find('{')
  end = stripped.rfind('}')
  if start == -1 or end == -1 or end <= start:
    return stripped
  return stripped[start : end + 1]


class ChatUIService:
  def __init__(self) -> None:
    self.design_lint = DesignLint()
    self.layout_engine = LayoutPolicyEngine()
    self.intent_compiler = IntentFrameCompiler()

  async def stream_frames(
      self, user_message: str, request_id: str = 'unknown'
  ) -> AsyncIterator[A2UIFrame]:
    messages = build_messages(user_message)
    parser = PlanningDeltaStreamParser()
    skeleton_compiler = SkeletonCompiler()
    rejected_lines: list[str] = []
    chunk_count = 0

    for frame in self._loading_frames():
      logger.info('[%s] Emitting loading frame=%s', request_id, _truncate(frame.model_dump(exclude_none=True)))
      yield frame

    logger.info(
        '[%s] Starting LLM stream. endpoint=%s model=%s temperature=%s',
        request_id,
        settings.openai_api_base,
        settings.litellm_model,
        settings.temperature,
    )
    logger.info('[%s] User message=%s', request_id, _truncate(user_message))
    logger.info('[%s] LLM messages=%s', request_id, _truncate(messages))

    response = await acompletion(
        model=settings.litellm_model,
        messages=messages,
        api_base=settings.openai_api_base,
        api_key=settings.openai_api_key,
        stream=True,
        temperature=settings.temperature,
        extra_body={
            "chat_template_kwargs": {
                "enable_thinking": False
            }
        },
    )

    async for chunk in response:
      delta = chunk.choices[0].delta if chunk.choices else None
      content = getattr(delta, 'content', None)
      if not content:
        continue
      chunk_count += 1
      logger.info('[%s] LLM chunk=%s', request_id, _truncate(content))
      parsed_records, rejected = parser.feed(content)
      rejected_lines.extend(rejected)
      for frame in self._compile_planning_records(parsed_records, skeleton_compiler, request_id):
        yield frame
      if not parser.seen_planning_delta:
        for frame in self._planning_wait_frames(parser.raw_output, chunk_count):
          logger.info('[%s] Emitting planning-wait frame=%s', request_id, _truncate(frame.model_dump(exclude_none=True)))
          yield frame

    parsed_records, trailing_rejected = parser.finish()
    rejected_lines.extend(trailing_rejected)
    for frame in self._compile_planning_records(parsed_records, skeleton_compiler, request_id):
      yield frame

    raw_output = parser.raw_output
    logger.info('[%s] Raw LLM output=%s', request_id, _truncate(raw_output))

    if parser.seen_planning_delta:
      for rejected_line in rejected_lines:
        logger.info('[%s] Ignoring non-planning line during delta stream=%s', request_id, _truncate(rejected_line))
      return

    intent_plan = self._parse_intent_plan(raw_output, request_id=request_id)
    if intent_plan is not None:
      normalized_plan = self.design_lint.normalize(intent_plan)
      layout = self.layout_engine.build(normalized_plan)
      logger.info('[%s] Normalized intent plan=%s', request_id, _truncate(normalized_plan.model_dump()))
      logger.info('[%s] Layout IR=%s', request_id, _truncate(self._layout_summary(layout)))
      for frame in self.intent_compiler.compile(layout):
        logger.info('[%s] Emitting intent A2UI frame=%s', request_id, _truncate(frame.model_dump(exclude_none=True)))
        yield frame
      return

    if self._looks_like_intent_json(raw_output):
      logger.warning('[%s] Intent-like JSON could not be parsed; emitting fallback error surface.', request_id)
      for frame in self._error_frames():
        logger.info('[%s] Emitting error frame=%s', request_id, _truncate(frame.model_dump(exclude_none=True)))
        yield frame
      return

    for frame in self._fallback_frames(raw_output, request_id=request_id):
      yield frame

  def _compile_planning_records(
      self,
      records: Iterable[PlanningDeltaRecord],
      skeleton_compiler: SkeletonCompiler,
      request_id: str,
  ) -> list[A2UIFrame]:
    frames: list[A2UIFrame] = []
    for record in records:
      logger.info('[%s] Parsed planning delta=%s', request_id, _truncate(record.raw_line))
      compiled = skeleton_compiler.apply(record.delta)
      for frame in compiled:
        logger.info('[%s] Emitting planning A2UI frame=%s', request_id, _truncate(frame.model_dump(exclude_none=True)))
      frames.extend(compiled)
    return frames

  def _parse_intent_plan(self, raw_output: str, request_id: str) -> IntentPlan | None:
    stripped = _extract_json_object(_strip_code_fences(raw_output))
    try:
      return INTENT_PLAN_ADAPTER.validate_json(stripped)
    except (ValidationError, ValueError, json.JSONDecodeError) as exc:
      logger.info('[%s] Intent plan parse skipped: %s', request_id, exc)
      try:
        return INTENT_PLAN_ADAPTER.validate_python(json.loads(stripped))
      except (ValidationError, ValueError, json.JSONDecodeError) as nested_exc:
        logger.info('[%s] Intent plan parse fallback failed: %s', request_id, nested_exc)
        return None

  def _fallback_frames(self, raw_output: str, request_id: str) -> list[A2UIFrame]:
    compiler = FrameCompiler()
    skeleton_compiler = SkeletonCompiler()
    frames: list[A2UIFrame] = []
    buffer = raw_output

    while '\n' in buffer:
      raw_line, buffer = buffer.split('\n', 1)
      line = raw_line.strip()
      if not line or line == '```' or line.startswith('```'):
        continue
      frames.extend(self._parse_legacy_line(line, compiler, skeleton_compiler, request_id))

    final_line = buffer.strip()
    if final_line and not final_line.startswith('```'):
      frames.extend(self._parse_legacy_line(final_line, compiler, skeleton_compiler, request_id))
    return frames

  def _parse_legacy_line(
      self,
      line: str,
      compiler: FrameCompiler,
      skeleton_compiler: SkeletonCompiler,
      request_id: str,
  ) -> list[A2UIFrame]:
    logger.info('[%s] Raw fallback line=%s', request_id, _truncate(line))
    try:
      payload = json.loads(line)
      try:
        parsed = SKELETON_DELTA_ADAPTER.validate_python(payload)
        active_compiler = skeleton_compiler
      except (ValidationError, ValueError):
        parsed = DELTA_ADAPTER.validate_python(payload)
        active_compiler = compiler
    except (json.JSONDecodeError, ValidationError, ValueError) as exc:
      logger.warning(
          '[%s] Failed to parse/validate fallback line=%s error=%s',
          request_id,
          _truncate(line),
          exc,
      )
      return []
    if isinstance(parsed, FinalizeDelta):
      logger.info('[%s] Received finalize event.', request_id)
      return active_compiler.apply(parsed) if active_compiler is skeleton_compiler else []
    logger.info('[%s] Parsed fallback delta=%s', request_id, _truncate(parsed.model_dump()))
    try:
      frames = active_compiler.apply(parsed)
      for frame in frames:
        logger.info('[%s] Emitting fallback A2UI frame=%s', request_id, _truncate(frame.model_dump(exclude_none=True)))
      return frames
    except Exception as exc:  # noqa: BLE001
      logger.exception(
          '[%s] Compiler failed for fallback delta=%s error=%s',
          request_id,
          _truncate(parsed.model_dump()),
          exc,
      )
      return []

  def _layout_summary(self, layout: Any) -> dict[str, Any]:
    return {
        'surface_id': getattr(layout, 'surface_id', 'main'),
        'child_count': len(getattr(layout, 'children', [])),
        'child_types': [type(child).__name__ for child in getattr(layout, 'children', [])],
    }

  def _looks_like_intent_json(self, raw_output: str) -> bool:
    stripped = _strip_code_fences(raw_output).strip()
    if not stripped.startswith('{'):
      return False
    return any(marker in stripped for marker in ('"sections"', '"page_kind"', '"primary_action"', '"layout_hint"'))

  def _planning_wait_frames(self, raw_output: str, chunk_count: int) -> list[A2UIFrame]:
    stripped = _strip_code_fences(raw_output).strip()
    lines = [line.strip() for line in stripped.splitlines() if line.strip() and not line.startswith('```')]
    preview = lines[-1][:140] if lines else '尚未接收到合法 planning delta，等待 init_plan...'
    metrics = f'流式分片：{chunk_count} · 原始字符：{len(raw_output)} · 已完成行：{len(lines)}'
    status = '等待首个 planning delta（期望先收到 init_plan，再逐步收到 region 与条目事件）。'
    return [
        self._data_frame(f'/content/{STREAM_STATUS_TEXT_ID}', 'text', status),
        self._data_frame(f'/content/{STREAM_PREVIEW_TEXT_ID}', 'text', f'模型输出预览\n{preview}'),
        self._data_frame(f'/content/{STREAM_METRICS_TEXT_ID}', 'text', metrics),
    ]

  def _data_frame(self, path: str, key: str, value: str) -> A2UIFrame:
    return A2UIFrame(
        dataModelUpdate={
            'surfaceId': 'main',
            'path': path,
            'contents': [DataMapEntry(key=key, valueString=value)],
        }
    )

  def _loading_frames(self) -> list[A2UIFrame]:
    compiler = FrameCompiler()
    frames = compiler.apply(
        InitSurfaceDelta(
            event='init_surface',
            surface_id='main',
            title='正在建立规划流',
            summary='后端正在等待模型输出 planning deltas，并将在收到 init_plan 后立即切到业务 UI。',
        )
    )
    frames.extend(
        compiler.apply(
            AddTextDelta(
                event='add_text',
                id=STREAM_STATUS_TEXT_ID,
                parent_id='root',
                text='已启动流式生成，等待首个 init_plan 事件。',
                usage_hint='body',
            )
        )
    )
    frames.extend(
        compiler.apply(
            AddTextDelta(
                event='add_text',
                id=STREAM_PREVIEW_TEXT_ID,
                parent_id='root',
                text='模型输出预览\n尚未接收到合法 planning delta，等待 init_plan...',
                usage_hint='body',
            )
        )
    )
    frames.extend(
        compiler.apply(
            AddTextDelta(
                event='add_text',
                id=STREAM_METRICS_TEXT_ID,
                parent_id='root',
                text='流式分片：0 · 原始字符：0 · 已完成行：0',
                usage_hint='caption',
            )
        )
    )
    return frames

  def _error_frames(self) -> list[A2UIFrame]:
    compiler = FrameCompiler()
    frames = compiler.apply(
        InitSurfaceDelta(
            event='init_surface',
            surface_id='main',
            title='页面规划失败',
            summary='模型返回了接近 Intent Plan 的 JSON，但未通过校验。',
        )
    )
    frames.extend(
        compiler.apply(
            AddTextDelta(
                event='add_text',
                id='intent_plan_error_text',
                parent_id='root',
                text='请检查 planning delta 或 Intent Plan 字段命名，并让模型重新生成更严格的输出。',
                usage_hint='body',
            )
        )
    )
    return frames
