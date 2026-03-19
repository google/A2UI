from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
  host: str = os.getenv("HOST", "0.0.0.0")
  port: int = int(os.getenv("PORT", "8010"))
  openai_api_base: str = os.getenv("OPENAI_API_BASE", "http://10.50.95.196:8000/v1")
  openai_api_key: str = os.getenv("OPENAI_API_KEY", "sk-1234")
  local_model_name: str = os.getenv("LOCAL_MODEL_NAME", "qwen3.5")
  litellm_model: str = os.getenv("LITELLM_MODEL", f"openai/{os.getenv('LOCAL_MODEL_NAME', 'qwen3.5')}")
  temperature: float = float(os.getenv("TEMPERATURE", "0.2"))


settings = Settings()
