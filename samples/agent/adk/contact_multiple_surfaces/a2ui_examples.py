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

FLOOR_PLAN_FILE = "floor_plan.json"
LOCATION_SURFACE_ID = "location-surface"


def load_floor_plan_example(version: str) -> str:
  """Loads the floor plan example specifically."""
  examples_dir = Path(os.path.dirname(__file__)) / "examples" / version
  file_path = examples_dir / FLOOR_PLAN_FILE
  try:
    return file_path.read_text(encoding="utf-8")
  except FileNotFoundError:
    logger.error(f"Floor plan example not found: {file_path}")
    return "[]"


def load_close_modal_example() -> list[dict]:
  """Constructs the JSON for closing the floor plan modal."""
  return [{"version": "v0.9", "deleteSurface": {"surfaceId": LOCATION_SURFACE_ID}}]


def load_send_message_example(contact_name: str) -> str:
  """Constructs the JSON string for the send message confirmation."""
  from pathlib import Path

  examples_dir = Path(os.path.dirname(__file__)) / "examples" / "0.9"
  action_file = examples_dir / "action_confirmation.json"

  if action_file.exists():
    json_content = action_file.read_text(encoding="utf-8").strip()
    if contact_name != "Unknown":
      json_content = json_content.replace(
          "Your action has been processed.", f"Message sent to {contact_name}!"
      )
    return json_content
  return (
      '[{ "version": "v0.9", "createSurface": { "surfaceId": "action-modal", "catalogId": "inline_catalog" } },'
      ' { "version": "v0.9", "updateComponents": { "surfaceId": "action-modal",'
      ' "components": [ { "id": "root", "component": "Modal", "entryPointChild": "hidden",'
      ' "contentChild": "msg", "open": true },'
      ' { "id": "hidden", "component": "Text", "text": " " },'
      ' { "id": "msg", "component": "Text", "text": "Message Sent (Fallback)" } ] } }]'
  )
