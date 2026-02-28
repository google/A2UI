"""Agent logic for the Component Gallery."""

import logging
import json
from collections.abc import AsyncIterable
from typing import Any

import asyncio
import datetime

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
    if "WHO_ARE_YOU" in query or "START" in query:  # Simple trigger for initial load
      gallery_json = get_gallery_json()
      yield {
          "is_task_complete": True,
          "payload": {
              "text": "Here is the component gallery.",
              "json_string": gallery_json,
          },
      }
      return

    # Handle Actions
    if query.startswith("ACTION:"):
      action_name = query
      # Create a response update for the second surface

      # Simulate network/processing delay
      await asyncio.sleep(0.5)

      timestamp = datetime.datetime.now().strftime("%H:%M:%S")

      response_update = [{
          "surfaceUpdate": {
              "surfaceId": "response-surface",
              "components": [{
                  "id": "response-text",
                  "component": {
                      "Text": {
                          "text": {
                              "literalString": (
                                  f"Agent Processed Action: {action_name} at"
                                  f" {timestamp}"
                              )
                          }
                      }
                  },
              }],
          }
      }]

      yield {
          "is_task_complete": True,
          "payload": {"text": "Action processed.", "json_data": response_update},
      }
      return

    # Fallback for text
    yield {
        "is_task_complete": True,
        "payload": {"text": "I am the Component Gallery Agent."},
    }
