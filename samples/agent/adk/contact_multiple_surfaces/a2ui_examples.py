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
from a2ui_schema import A2UI_SCHEMA

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


def load_examples(base_url: str = "http://localhost:10004") -> str:
  """
  Loads, validates, and formats the UI examples from JSON files.

  Args:
      base_url: The base URL to replace placeholder URLs with.
                (Currently examples have http://localhost:10004 hardcoded,
                 but we can make this dynamic if needed).

  Returns:
      A string containing all formatted examples for the prompt.
  """

  # Pre-parse validator
  try:
    single_msg_schema = json.loads(A2UI_SCHEMA)
    # Examples are typically lists of messages
    list_schema = {"type": "array", "items": single_msg_schema}
  except json.JSONDecodeError:
    logger.error("Failed to parse A2UI_SCHEMA for validation")
    list_schema = None

  examples_dir = Path(os.path.dirname(__file__)) / "examples"
  formatted_output = []

  for curr_name, filename in EXAMPLE_FILES.items():
    file_path = examples_dir / filename
    try:
      content = file_path.read_text(encoding="utf-8")

      # basic replacement if we decide to template the URL in JSON files
      # content = content.replace("{{BASE_URL}}", base_url)

      # Validation
      if list_schema:
        try:
          data = json.loads(content)
          jsonschema.validate(instance=data, schema=list_schema)
        except (json.JSONDecodeError, jsonschema.ValidationError) as e:
          logger.warning(f"Example {filename} validation failed: {e}")

      formatted_output.append(f"---BEGIN {curr_name}---")
      # Handle examples that include user/model text
      if curr_name == "ORG_CHART_EXAMPLE":
        formatted_output.append("User: Show me the org chart for Casey Smith")
        formatted_output.append("Model: Here is the organizational chart.")
        formatted_output.append("---a2ui_JSON---")
      elif curr_name == "MULTI_SURFACE_EXAMPLE":
        formatted_output.append("User: Full profile for Casey Smith")
        formatted_output.append(
            "Model: Here is the full profile including contact details and org chart."
        )
        formatted_output.append("---a2ui_JSON---")
      elif curr_name == "CHART_NODE_CLICK_EXAMPLE":
        formatted_output.append(
            'User: ACTION: chart_node_click (context: clickedNodeName="John Smith")'
            " (from modal)"
        )
        formatted_output.append("Model: Here is the profile for John Smith.")
        formatted_output.append("---a2ui_JSON---")

      formatted_output.append(content.strip())
      formatted_output.append(f"---END {curr_name}---")
      formatted_output.append("")  # Newline

    except FileNotFoundError:
      logger.error(f"Example file not found: {file_path}")

  return "\n".join(formatted_output)


def load_floor_plan_example() -> str:
  """Loads the floor plan example specifically."""
  examples_dir = Path(os.path.dirname(__file__)) / "examples"
  file_path = examples_dir / FLOOR_PLAN_FILE
  try:
    return file_path.read_text(encoding="utf-8")
  except FileNotFoundError:
    logger.error(f"Floor plan example not found: {file_path}")
    return "[]"
