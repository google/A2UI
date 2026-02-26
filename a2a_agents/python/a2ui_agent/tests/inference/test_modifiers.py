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

import pytest
from unittest.mock import patch
from a2ui.inference.schema.manager import A2uiSchemaManager
from a2ui.inference.schema.common_modifiers import remove_strict_validation


def test_remove_strict_validation():
  """Tests the remove_strict_validation modifier."""
  schema = {
      "type": "object",
      "properties": {
          "a": {"type": "string", "additionalProperties": False},
          "b": {
              "type": "array",
              "items": {"type": "object", "additionalProperties": False},
          },
      },
      "additionalProperties": False,
  }

  modified = remove_strict_validation(schema)

  # Check that additionalProperties: False is removed
  assert "additionalProperties" not in modified
  assert "additionalProperties" not in modified["properties"]["a"]
  assert "additionalProperties" not in modified["properties"]["b"]["items"]

  # Check that it didn't mutate the original
  assert schema["additionalProperties"] is False
  assert schema["properties"]["a"]["additionalProperties"] is False


def test_manager_with_modifiers():
  """Tests that A2uiSchemaManager applies modifiers during loading."""
  # Mock _load_basic_component to return a simple schema with strict validation
  mock_schema = {"type": "object", "additionalProperties": False}
  with patch(
      "a2ui.inference.schema.manager._load_basic_component", return_value=mock_schema
  ):
    manager = A2uiSchemaManager("0.8", schema_modifiers=[remove_strict_validation])

    # Verify that loaded schemas have modifiers applied
    assert "additionalProperties" not in manager._server_to_client_schema
    assert "additionalProperties" not in manager._common_types_schema

    # basic catalog should also be modified
    for catalog in manager._supported_catalogs.values():
      assert "additionalProperties" not in catalog.catalog_schema


def test_manager_no_modifiers():
  """Tests that A2uiSchemaManager works fine without modifiers."""
  mock_schema = {"type": "object", "additionalProperties": False}
  with patch(
      "a2ui.inference.schema.manager._load_basic_component", return_value=mock_schema
  ):
    manager = A2uiSchemaManager("0.8", schema_modifiers=None)

    # Verify that schemas are NOT modified
    assert manager._server_to_client_schema["additionalProperties"] is False
