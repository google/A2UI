"""
FastAPI Server for Personalized Learning Agent

Provides HTTP endpoints for the A2A agent that generates A2UI learning materials.
This can run locally or be deployed to Agent Engine.
"""

import json
import logging
import os
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agent import get_agent, LearningMaterialAgent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Personalized Learning Agent",
    description="A2A agent for generating personalized A2UI learning materials",
    version="0.1.0",
)

# CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    """Request model for content generation."""

    format: str
    context: str = ""
    session_id: str = "default"


class A2ARequest(BaseModel):
    """A2A protocol request model."""

    message: str
    session_id: str = "default"
    extensions: list[str] = []


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "agent": "personalized-learning-agent"}


@app.get("/capabilities")
async def get_capabilities():
    """Return agent capabilities for A2A discovery."""
    return {
        "name": "Personalized Learning Agent",
        "description": "Generates personalized A2UI learning materials",
        "supported_formats": LearningMaterialAgent.SUPPORTED_FORMATS,
        "extensions": [
            {
                "uri": "https://a2ui.org/a2a-extension/a2ui/v0.8",
                "description": "Provides agent driven UI using the A2UI JSON format.",
            }
        ],
    }


@app.post("/generate")
async def generate_content(request: GenerateRequest):
    """
    Generate A2UI content for the specified format.

    Args:
        request: Generation request with format and optional context

    Returns:
        A2UI JSON response
    """
    logger.info(f"Generate request: format={request.format}, context={request.context[:50]}...")

    agent = get_agent()
    result = await agent.generate_content(request.format, request.context)

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result


@app.post("/a2a/stream")
async def a2a_stream(request: A2ARequest):
    """
    A2A-compatible streaming endpoint.

    Args:
        request: A2A request with message

    Returns:
        Streaming response with A2UI JSON
    """
    logger.info(f"A2A stream request: {request.message}")

    agent = get_agent()

    async def generate():
        async for chunk in agent.stream(request.message, request.session_id):
            yield f"data: {json.dumps(chunk)}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
    )


@app.post("/a2a/query")
async def a2a_query(request: A2ARequest):
    """
    A2A-compatible non-streaming endpoint.

    Args:
        request: A2A request with message in format "type:context"

    Returns:
        A2UI JSON response
    """
    logger.info(f"A2A query request: {request.message}")

    # Parse message (format: "type:context" or just "type")
    parts = request.message.split(":", 1)
    format_type = parts[0].strip()
    context = parts[1].strip() if len(parts) > 1 else ""

    agent = get_agent()
    result = await agent.generate_content(format_type, context)

    return result


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8081"))
    uvicorn.run(app, host="0.0.0.0", port=port)
