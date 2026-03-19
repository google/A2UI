from __future__ import annotations

import json
from collections.abc import AsyncIterator

from litellm import acompletion
from pydantic import ValidationError

from compiler import FrameCompiler
from models import A2UIFrame, DELTA_ADAPTER
from prompting import build_messages
from settings import settings


class ChatUIService:
  async def stream_frames(self, user_message: str) -> AsyncIterator[A2UIFrame]:
    compiler = FrameCompiler()
    buffer = ""

    response = await acompletion(
        model=settings.litellm_model,
        messages=build_messages(user_message),
        api_base=settings.openai_api_base,
        api_key=settings.openai_api_key,
        stream=True,
        temperature=settings.temperature,
    )

    async for chunk in response:
      delta = chunk.choices[0].delta if chunk.choices else None
      content = getattr(delta, "content", None)
      if not content:
        continue
      buffer += content
      while "\n" in buffer:
        raw_line, buffer = buffer.split("\n", 1)
        line = raw_line.strip()
        if not line or line == "```" or line.startswith("```"):
          continue
        try:
          parsed = DELTA_ADAPTER.validate_python(json.loads(line))
        except (json.JSONDecodeError, ValidationError, ValueError):
          continue
        for frame in compiler.apply(parsed):
          yield frame

    final_line = buffer.strip()
    if final_line and not final_line.startswith("```"):
      try:
        parsed = DELTA_ADAPTER.validate_python(json.loads(final_line))
      except (json.JSONDecodeError, ValidationError, ValueError):
        return
      for frame in compiler.apply(parsed):
        yield frame
