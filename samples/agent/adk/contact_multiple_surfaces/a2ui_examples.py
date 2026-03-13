# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json
import logging
import os
from pathlib import Path

import jsonschema

logger = logging.getLogger(__name__)

# Map logical example names (used in prompt) to filenames
EXAMPLE_FILES = {
    "CONTACT_LIST_EXAMPLE": "contact_list.json",
    "CONTACT_CARD_EXAMPLE": "contact_card.json",
    "ACTION_CONFIRMATION_EXAMPLE": "action_confirmation.json",
    "ORG_CHART_EXAMPLE": "org_chart.json",
    "MULTI_SURFACE_EXAMPLE": "multi_surface.json",
    "CHART_NODE_CLICK_EXAMPLE": "chart_node_click.json",
}

FLOOR_PLAN_FILE = "floor_plan.json"
LOCATION_SURFACE_ID = "location-surface"


def load_floor_plan_example(html_content: str = "") -> list[dict]:
  """Constructs the JSON for the location surface displaying the floor plan."""
  import os

  title_suffix = (
      "(MCP Apps)"
      if os.environ.get("USE_MCP_SANDBOX", "true").lower() == "true"
      else "(iFrame)"
  )
  return [
      {
          "beginRendering": {
              "surfaceId": LOCATION_SURFACE_ID,
              "root": "floor-plan-card",
          }
      },
      {
          "surfaceUpdate": {
              "surfaceId": LOCATION_SURFACE_ID,
              "components": [
                  {
                      "id": "floor-plan-card",
                      "component": {"Card": {"child": "floor-plan-col"}},
                  },
                  {
                      "id": "floor-plan-col",
                      "component": {
                          "Column": {
                              "children": {
                                  "explicitList": [
                                      "floor-plan-title",
                                      "floor-plan-comp",
                                      "dismiss-fp",
                                  ]
                              }
                          }
                      },
                  },
                  {
                      "id": "floor-plan-title",
                      "component": {
                          "Text": {
                              "usageHint": "h2",
                              "text": {
                                  "literalString": f"Office Floor Plan {title_suffix}"
                              },
                          }
                      },
                  },
                  {
                      "id": "floor-plan-comp",
                      "component": (
                          {
                              "McpApp": {
                                  "htmlContent": html_content,
                                  "height": 400,
                                  "allowedTools": ["chart_node_click"],
                              }
                          }
                          if os.environ.get("USE_MCP_SANDBOX", "true").lower() == "true"
                          else {
                              "WebFrame": {
                                  "html": html_content,
                                  "height": 400,
                                  "interactionMode": "interactive",
                                  "allowedEvents": ["chart_node_click"],
                              }
                          }
                      ),
                  },
                  {
                      "id": "dismiss-fp-text",
                      "component": {"Text": {"text": {"literalString": "Close Map"}}},
                  },
                  {
                      "id": "dismiss-fp",
                      "component": {
                          "Button": {
                              "child": "dismiss-fp-text",
                              # Represents closing the FloorPlan overlay
                              "action": {"name": "close_modal", "context": []},
                          }
                      },
                  },
              ],
          }
      },
  ]


def load_close_modal_example() -> list[dict]:
  """Constructs the JSON for closing the floor plan modal."""
  return [{"deleteSurface": {"surfaceId": LOCATION_SURFACE_ID}}]


def load_send_message_example(contact_name: str) -> str:
  """Constructs the JSON string for the send message confirmation."""
  from pathlib import Path

  examples_dir = Path(os.path.dirname(__file__)) / "examples"
  action_file = examples_dir / "action_confirmation.json"

  if action_file.exists():
    json_content = action_file.read_text(encoding="utf-8").strip()
    if contact_name != "Unknown":
      json_content = json_content.replace(
          "Your action has been processed.", f"Message sent to {contact_name}!"
      )
    return json_content
  return (
      '[{ "beginRendering": { "surfaceId": "action-modal", "root":'
      ' "modal-wrapper" } }, { "surfaceUpdate": { "surfaceId": "action-modal",'
      ' "components": [ { "id": "modal-wrapper", "component": { "Modal": {'
      ' "entryPointChild": "hidden", "contentChild": "msg", "open": true } } },'
      ' { "id": "hidden", "component": { "Text": { "text": {"literalString": "'
      ' "} } } }, { "id": "msg", "component": { "Text": { "text":'
      ' {"literalString": "Message Sent (Fallback)"} } } } ] } }]'
  )
