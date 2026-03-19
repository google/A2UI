from __future__ import annotations

import json
import logging
from collections.abc import AsyncIterator
from typing import Any

from litellm import acompletion
from pydantic import ValidationError

from compiler import FrameCompiler
from models import A2UIFrame, DELTA_ADAPTER, FinalizeDelta
from prompting import build_messages
from settings import settings

logger = logging.getLogger(__name__)


def _truncate(value: Any) -> str:
  text = value if isinstance(value, str) else json.dumps(value, ensure_ascii=False)
  return text[: settings.max_log_chars]


class ChatUIService:
  async def stream_frames(
      self, user_message: str, request_id: str = 'unknown'
  ) -> AsyncIterator[A2UIFrame]:
    compiler = FrameCompiler()
    buffer = ''
    messages = build_messages(user_message)

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
      buffer += content
      while '\n' in buffer:
        raw_line, buffer = buffer.split('\n', 1)
        line = raw_line.strip()
        if not line or line == '```' or line.startswith('```'):
          continue
        logger.info('[%s] Raw NDJSON line=%s', request_id, _truncate(line))
        try:
          parsed = DELTA_ADAPTER.validate_python(json.loads(line))
        except (json.JSONDecodeError, ValidationError, ValueError) as exc:
          logger.warning(
              '[%s] Failed to parse/validate delta line=%s error=%s',
              request_id,
              _truncate(line),
              exc,
          )
          continue
        if isinstance(parsed, FinalizeDelta):
          logger.info('[%s] Received finalize event.', request_id)
          continue
        logger.info('[%s] Parsed delta=%s', request_id, _truncate(parsed.model_dump()))
        try:
          for frame in compiler.apply(parsed):
            logger.info(
                '[%s] Emitting A2UI frame=%s',
                request_id,
                _truncate(frame.model_dump(exclude_none=True)),
            )
            yield frame
        except Exception as exc:  # noqa: BLE001
          logger.exception(
              '[%s] Compiler failed for delta=%s error=%s',
              request_id,
              _truncate(parsed.model_dump()),
              exc,
          )

    final_line = buffer.strip()
    if final_line and not final_line.startswith('```'):
      logger.info('[%s] Final buffered line=%s', request_id, _truncate(final_line))
      try:
        parsed = DELTA_ADAPTER.validate_python(json.loads(final_line))
      except (json.JSONDecodeError, ValidationError, ValueError) as exc:
        logger.warning(
            '[%s] Failed to parse final delta line=%s error=%s',
            request_id,
            _truncate(final_line),
            exc,
        )
        return
      if isinstance(parsed, FinalizeDelta):
        logger.info('[%s] Received final finalize event.', request_id)
        return
      logger.info('[%s] Parsed final delta=%s', request_id, _truncate(parsed.model_dump()))
      try:
        for frame in compiler.apply(parsed):
          logger.info(
              '[%s] Emitting final A2UI frame=%s',
              request_id,
              _truncate(frame.model_dump(exclude_none=True)),
          )
          yield frame
      except Exception as exc:  # noqa: BLE001
        logger.exception(
            '[%s] Compiler failed for final delta=%s error=%s',
            request_id,
            _truncate(parsed.model_dump()),
            exc,
        )
