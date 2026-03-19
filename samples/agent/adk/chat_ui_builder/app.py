from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from service import ChatUIService


class ChatRequest(BaseModel):
  message: str


app = FastAPI(title="A2UI Chat UI Builder")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

service = ChatUIService()


@app.get("/health")
async def health() -> dict[str, str]:
  return {"status": "ok"}


@app.post("/api/chat/stream")
async def chat_stream(payload: ChatRequest) -> StreamingResponse:
  async def frame_stream():
    async for frame in service.stream_frames(payload.message):
      yield frame.model_dump_json(exclude_none=True) + "\n"

  return StreamingResponse(frame_stream(), media_type="application/x-ndjson")
