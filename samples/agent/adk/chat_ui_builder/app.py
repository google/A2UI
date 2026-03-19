from __future__ import annotations

import logging
from uuid import uuid4

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from service import ChatUIService
from settings import settings

logging.basicConfig(
    level=getattr(logging, settings.log_level, logging.INFO),
    format='%(asctime)s %(levelname)s %(name)s %(message)s',
)
logger = logging.getLogger(__name__)


class ChatRequest(BaseModel):
  message: str


app = FastAPI(title='A2UI Chat UI Builder')
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r'http://localhost:\d+',
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

service = ChatUIService()


@app.on_event('startup')
async def startup_event() -> None:
  logger.info(
      'Chat UI Builder startup. host=%s port=%s endpoint=%s model=%s log_level=%s',
      settings.host,
      settings.port,
      settings.openai_api_base,
      settings.litellm_model,
      settings.log_level,
  )


@app.get('/health')
async def health() -> dict[str, str]:
  return {'status': 'ok'}


@app.post('/api/chat/stream')
async def chat_stream(payload: ChatRequest) -> StreamingResponse:
  request_id = uuid4().hex[:8]
  logger.info('[%s] Incoming chat request message=%s', request_id, payload.message[: settings.max_log_chars])

  async def frame_stream():
    async for frame in service.stream_frames(payload.message, request_id=request_id):
      body = frame.model_dump_json(exclude_none=True)
      logger.info('[%s] Streaming frame body=%s', request_id, body[: settings.max_log_chars])
      yield body + '\n'

  return StreamingResponse(frame_stream(), media_type='application/x-ndjson')
