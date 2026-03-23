from __future__ import annotations

import json
import logging
import re
from collections.abc import AsyncIterator
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
    raw_output = ''
    emitted_progress_fingerprint: str | None = None
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
    )

    async for chunk in response:
      delta = chunk.choices[0].delta if chunk.choices else None
      content = getattr(delta, 'content', None)
      if not content:
        continue
      chunk_count += 1
      logger.info('[%s] LLM chunk=%s', request_id, _truncate(content))
      raw_output += content
      progress_frames, emitted_progress_fingerprint = self._stream_progress_frames(
          raw_output,
          chunk_count=chunk_count,
          emitted_progress_fingerprint=emitted_progress_fingerprint,
      )
      for frame in progress_frames:
        logger.info('[%s] Emitting progress frame=%s', request_id, _truncate(frame.model_dump(exclude_none=True)))
        yield frame

    logger.info('[%s] Raw LLM output=%s', request_id, _truncate(raw_output))
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
    logger.info('[%s] Raw NDJSON line=%s', request_id, _truncate(line))
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
          '[%s] Failed to parse/validate delta line=%s error=%s',
          request_id,
          _truncate(line),
          exc,
      )
      return []
    if isinstance(parsed, FinalizeDelta):
      logger.info('[%s] Received finalize event.', request_id)
      return []
    logger.info('[%s] Parsed legacy delta=%s', request_id, _truncate(parsed.model_dump()))
    try:
      frames = active_compiler.apply(parsed)
      for frame in frames:
        logger.info('[%s] Emitting legacy A2UI frame=%s', request_id, _truncate(frame.model_dump(exclude_none=True)))
      return frames
    except Exception as exc:  # noqa: BLE001
      logger.exception(
          '[%s] Compiler failed for legacy delta=%s error=%s',
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

  def _stream_progress_frames(
      self,
      raw_output: str,
      chunk_count: int,
      emitted_progress_fingerprint: str | None,
  ) -> tuple[list[A2UIFrame], str | None]:
    progress_snapshot = self._build_progress_snapshot(raw_output, chunk_count)
    fingerprint = json.dumps(progress_snapshot, ensure_ascii=False, sort_keys=True)
    if fingerprint == emitted_progress_fingerprint:
      return [], emitted_progress_fingerprint
    return self._progress_frames(progress_snapshot), fingerprint

  def _build_progress_snapshot(self, raw_output: str, chunk_count: int) -> dict[str, str]:
    compact_output = _strip_code_fences(raw_output).strip()
    title = self._extract_first_string_field(compact_output, 'title')
    page_kind = self._extract_first_string_field(compact_output, 'page_kind')
    primary_action = self._extract_nested_action_label(compact_output, 'primary_action')
    section_titles = self._extract_section_titles(compact_output)
    section_summary = '、'.join(section_titles[:4]) if section_titles else '尚未解析到 section 标题'
    if len(section_titles) > 4:
      section_summary += f' 等 {len(section_titles)} 个 section'

    status_parts = [f'已接收 {len(raw_output)} 个字符', f'{chunk_count} 个流式分片']
    if title:
      status_parts.append(f'页面标题候选：{title}')
    elif '"sections"' in compact_output:
      status_parts.append('已检测到 sections，正在补齐结构')
    else:
      status_parts.append('正在等待稳定的 Intent Plan JSON 闭合')

    preview_lines = ['模型规划预览']
    preview_lines.append(f'- 页面类型：{page_kind or "尚未识别"}')
    preview_lines.append(f'- 页面标题：{title or "尚未识别"}')
    preview_lines.append(f'- 主操作：{primary_action or "尚未识别"}')
    preview_lines.append(f'- Section：{section_summary}')

    return {
        'status': '；'.join(status_parts),
        'preview': '\n'.join(preview_lines),
        'metrics': self._progress_metrics(compact_output, chunk_count, len(section_titles)),
    }

  def _progress_metrics(self, compact_output: str, chunk_count: int, section_count: int) -> str:
    opening_braces = compact_output.count('{')
    closing_braces = compact_output.count('}')
    opening_brackets = compact_output.count('[')
    closing_brackets = compact_output.count(']')
    brace_state = f'花括号 {closing_braces}/{opening_braces}'
    bracket_state = f'方括号 {closing_brackets}/{opening_brackets}'
    return f'流式分片：{chunk_count} · 已识别 section：{section_count} · {brace_state} · {bracket_state}'

  def _extract_first_string_field(self, raw_output: str, field_name: str) -> str | None:
    pattern = rf'"{re.escape(field_name)}"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"'
    match = re.search(pattern, raw_output)
    if not match:
      return None
    return json.loads(f'"{match.group(1)}"')

  def _extract_nested_action_label(self, raw_output: str, field_name: str) -> str | None:
    block_pattern = rf'"{re.escape(field_name)}"\s*:\s*\{{(?P<body>.*?)\}}'
    match = re.search(block_pattern, raw_output, re.DOTALL)
    if not match:
      return None
    return self._extract_first_string_field(match.group('body'), 'label')

  def _extract_section_titles(self, raw_output: str) -> list[str]:
    titles = re.findall(r'"sections"\s*:\s*\[.*?"title"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"', raw_output, re.DOTALL)
    if not titles:
      titles = re.findall(r'"role"\s*:\s*"[^"]+"\s*,(?:.|\n){0,240}?"title"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"', raw_output)
    decoded: list[str] = []
    seen: set[str] = set()
    for title in titles:
      value = json.loads(f'"{title}"')
      if value not in seen:
        seen.add(value)
        decoded.append(value)
    return decoded

  def _progress_frames(self, snapshot: dict[str, str]) -> list[A2UIFrame]:
    return [
        self._data_frame(f'/content/{STREAM_STATUS_TEXT_ID}', 'text', snapshot['status']),
        self._data_frame(f'/content/{STREAM_PREVIEW_TEXT_ID}', 'text', snapshot['preview']),
        self._data_frame(f'/content/{STREAM_METRICS_TEXT_ID}', 'text', snapshot['metrics']),
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
            title='正在生成界面',
            summary='后端正在等待模型输出 Intent Plan，并将其编译成 A2UI 骨架。',
        )
    )
    frames.extend(
        compiler.apply(
            AddTextDelta(
                event='add_text',
                id=STREAM_STATUS_TEXT_ID,
                parent_id='root',
                text='已启动流式生成，正在等待模型逐步输出 Intent Plan JSON。',
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
                text='模型规划预览\n- 页面类型：尚未识别\n- 页面标题：尚未识别\n- 主操作：尚未识别\n- Section：尚未解析到 section 标题',
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
                text='流式分片：0 · 已识别 section：0 · 花括号 0/0 · 方括号 0/0',
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
                text='请检查流程图节点 kind、字段命名或让模型重新生成更严格的 Intent Plan JSON。',
                usage_hint='body',
            )
        )
    )
    return frames
