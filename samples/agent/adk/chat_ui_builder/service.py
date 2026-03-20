from __future__ import annotations

import json
import logging
from collections.abc import AsyncIterator
from typing import Any

from litellm import acompletion
from pydantic import ValidationError

from compiler import FrameCompiler
from design_lint import DesignLint
from intent_compiler import IntentFrameCompiler
from intent_plan import INTENT_PLAN_ADAPTER, IntentPlan
from layout_policy import LayoutPolicyEngine
from models import A2UIFrame, DELTA_ADAPTER, FinalizeDelta, SKELETON_DELTA_ADAPTER
from prompting import build_messages
from skeleton_compiler import SkeletonCompiler
from settings import settings

logger = logging.getLogger(__name__)


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
      logger.info('[%s] LLM chunk=%s', request_id, _truncate(content))
      raw_output += content

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
