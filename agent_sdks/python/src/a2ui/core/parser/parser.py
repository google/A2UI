# Copyright 2026 Google LLC
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
from typing import Tuple, Any
from ..schema.constants import A2UI_DELIMITER
from .payload_fixer import parse_and_fix


def parse_response(content: str) -> Tuple[str, Any]:
  """
    Parses the LLM response into a text part and a JSON object.

    Args:
        content: The raw LLM response.

    Returns:
        A tuple of (text_part, json_object).
      - text_part (str): The text before the delimiter, stripped of whitespace.
      - json_object (Any): The parsed JSON object.

  Raises:
      ValueError: If the delimiter is missing, the JSON part is empty, or the JSON
                  part is invalid.
  """
  if A2UI_DELIMITER not in content:
    raise ValueError(f"Delimiter '{A2UI_DELIMITER}' not found in response.")

  text_part, json_string = content.split(A2UI_DELIMITER, 1)
  text_part = text_part.strip()

  # Clean the JSON string (strip whitespace and common markdown blocks)
  json_string_cleaned = (
      json_string.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
  )

  if not json_string_cleaned:
    raise ValueError("A2UI JSON part is empty.")

  json_data = parse_and_fix(json_string_cleaned)
  return text_part, json_data
