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

import re
from dataclasses import dataclass
from typing import List, Optional, Any
from ..schema.constants import A2UI_OPEN_TAG, A2UI_CLOSE_TAG
from .payload_fixer import parse_and_fix


_A2UI_BLOCK_PATTERN = re.compile(
    f"{re.escape(A2UI_OPEN_TAG)}(.*?){re.escape(A2UI_CLOSE_TAG)}", re.DOTALL
)


@dataclass
class ResponsePart:
  """Represents a part of the LLM response.

  Attributes:
      text: The conversational text part. Can be an empty string.
      a2ui_json: The parsed A2UI JSON data. None if this part only contains
        trailing text.
  """

  text: str
  a2ui_json: Optional[Any] = None


def has_a2ui_parts(content: str) -> bool:
  """Checks if the content has A2UI parts."""
  return A2UI_OPEN_TAG in content and A2UI_CLOSE_TAG in content


def _sanitize_json_string(json_string: str) -> str:
  """Sanitizes the JSON string by removing markdown code blocks."""
  json_string = json_string.strip()
  if json_string.startswith("```json"):
    json_string = json_string[len("```json") :]
  elif json_string.startswith("```"):
    json_string = json_string[len("```") :]
  if json_string.endswith("```"):
    json_string = json_string[: -len("```")]
  json_string = json_string.strip()
  return json_string


def parse_response(content: str) -> List[ResponsePart]:
  """
  Parses the LLM response into a list of ResponsePart objects.

  Args:
      content: The raw LLM response.

  Returns:
      A list of ResponsePart objects.

  Raises:
      ValueError: If no A2UI tags are found or if the JSON part is invalid.
  """
  matches = list(_A2UI_BLOCK_PATTERN.finditer(content))

  if not matches:
    raise ValueError(
        f"A2UI tags '{A2UI_OPEN_TAG}' and '{A2UI_CLOSE_TAG}' not found in response."
    )

  response_parts = []
  last_end = 0

  for match in matches:
    start, end = match.span()
    # Text preceding the JSON block
    text_part = content[last_end:start].strip()

    # The JSON content within the tags
    json_string = match.group(1)
    json_string_cleaned = _sanitize_json_string(json_string)
    if not json_string_cleaned:
      raise ValueError("A2UI JSON part is empty.")

    json_data = parse_and_fix(json_string_cleaned)
    response_parts.append(ResponsePart(text=text_part, a2ui_json=json_data))
    last_end = end

  # Trailing text after the last JSON block
  trailing_text = content[last_end:].strip()
  if trailing_text:
    response_parts.append(ResponsePart(text=trailing_text, a2ui_json=None))

  return response_parts
