
"""Agent logic for the Component Gallery."""
import logging
import json
from collections.abc import AsyncIterable
from typing import Any

from google.adk.agents.llm_agent import LlmAgent
from google.adk.artifacts import InMemoryArtifactService
from google.adk.memory.in_memory_memory_service import InMemoryMemoryService
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from gallery_examples import get_gallery_json

logger = logging.getLogger(__name__)

class ComponentGalleryAgent:
    """An agent that displays a component gallery."""

    def __init__(self, base_url: str):
        self.base_url = base_url

    async def stream(self, query: str, session_id: str) -> AsyncIterable[dict[str, Any]]:
        """Streams the gallery or responses to actions."""
        
        logger.info(f"Stream called with query: {query}")
        
        # Initial Load or Reset
        if "WHO_ARE_YOU" in query or "START" in query: # Simple trigger for initial load
             gallery_json = get_gallery_json()
             response = f"Here is the component gallery.\n---a2ui_JSON---\n{gallery_json}"
             yield {
                "is_task_complete": True,
                "content": response
             }
             return

        # Handle Actions
        if query.startswith("ACTION:"):
             action_name = query
             # Create a response update for the second surface
             import datetime
             import asyncio
             
             # Simulate network/processing delay
             await asyncio.sleep(0.5)
             
             timestamp = datetime.datetime.now().strftime("%H:%M:%S")
             
             response_update = [
                 {
                     "surfaceUpdate": {
                         "surfaceId": "response-surface",
                         "components": [
                             {
                                 "id": "response-text",
                                 "component": {
                                     "Text": { "text": { "literalString": f"Agent Processed Action: {action_name} at {timestamp}" } }
                                 }
                             }
                         ]
                     }
                 }
             ]
             
             json_str = json.dumps(response_update)
             response = f"Action processed.\n---a2ui_JSON---\n{json_str}"
             yield {
                "is_task_complete": True,
                "content": response
             }
             return

        # Fallback for text
        yield {
             "is_task_complete": True,
             "content": "I am the Component Gallery Agent."
        }
