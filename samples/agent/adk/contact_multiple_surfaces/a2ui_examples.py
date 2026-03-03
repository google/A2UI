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


def load_floor_plan_example() -> str:
  """Loads the floor plan example specifically."""
  examples_dir = Path(os.path.dirname(__file__)) / "examples"
  file_path = examples_dir / FLOOR_PLAN_FILE
  try:
    return file_path.read_text(encoding="utf-8")
  except FileNotFoundError:
    logger.error(f"Floor plan example not found: {file_path}")
    return "[]"
