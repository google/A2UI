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

"""Utilities for A2UI Schema manipulation."""

from typing import Any


def wrap_as_json_array(a2ui_schema: dict[str, Any]) -> dict[str, Any]:
  """Wraps the A2UI schema in an array object to support multiple parts.

  Args:
      a2ui_schema: The A2UI schema to wrap.

  Returns:
      The wrapped A2UI schema object.

  Raises:
      ValueError: If the A2UI schema is empty.
  """
  if not a2ui_schema:
    raise ValueError("A2UI schema is empty")
  return {"type": "array", "items": a2ui_schema}
