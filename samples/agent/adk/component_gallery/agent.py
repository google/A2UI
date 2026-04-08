# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Agent logic for the Component Gallery."""

import logging
from collections.abc import AsyncIterable
from typing import Any, Optional
import json

from a2a.types import DataPart, Part, TextPart
from a2ui.schema.constants import A2UI_OPEN_TAG, A2UI_CLOSE_TAG
from a2ui.a2a.parts import create_a2ui_part, parse_response_to_parts

import asyncio
import datetime

from gallery_examples import get_gallery_json

logger = logging.getLogger(__name__)


class ComponentGalleryAgent:
  """An agent that displays a component gallery."""

  def __init__(self, base_url: str):
    self.base_url = base_url

  async def stream(
      self, query: str, session_id: str, active_ui_version: Optional[str]
  ) -> AsyncIterable[dict[str, Any]]:
    """Streams the gallery or responses to actions."""

    logger.info(
        f"Stream called with query: {query} and active_ui_version: {active_ui_version}"
    )

    # Initial Load or Reset
    if "WHO_ARE_YOU" in query or "START" in query:  # Simple trigger for initial load
      gallery_json = get_gallery_json(active_ui_version)
      yield {
          "is_task_complete": True,
          "parts": parse_response_to_parts(
              "Here is the component"
              f" gallery.\n{A2UI_OPEN_TAG}\n{gallery_json}\n{A2UI_CLOSE_TAG}"
          ),
      }
      return

    # Handle Actions
    if query.startswith("ACTION:"):
      action_name = query
      # Create a response update for the second surface

      # Simulate network/processing delay
      await asyncio.sleep(0.5)

      timestamp = datetime.datetime.now().strftime("%H:%M:%S")

      response_update = {
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
      }

      yield {
          "is_task_complete": True,
          "parts": [
              Part(root=TextPart(text="Action processed.")),
              create_a2ui_part(response_update),
          ],
      }
      return

    # Fallback for text
    yield {
        "is_task_complete": True,
        "parts": [Part(root=TextPart(text="I am the Component Gallery Agent."))],
    }
