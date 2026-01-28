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

import io
import pytest
import json
from unittest.mock import patch, MagicMock
from a2ui.inference.schema.manager import A2uiSchemaManager

test_version = "0.8"


@pytest.fixture
def mock_importlib_resources():
  with patch("importlib.resources.files") as mock_files:
    yield mock_files


def test_schema_manager_init_valid_version(mock_importlib_resources):
  mock_files = mock_importlib_resources
  mock_traversable = MagicMock()

  def files_side_effect(package):
    if package == f"a2ui.assets.{test_version}":
      return mock_traversable
    return MagicMock()

  mock_files.side_effect = files_side_effect

  # Mock file open calls for server_to_client and catalog
  def joinpath_side_effect(path):
    mock_file = MagicMock()
    if path == "server_to_client.json":
      content = '{"version": "0.8", "defs": "server_defs"}'
    elif path == "standard_catalog_definition.json":
      content = '{"version": "0.8", "components": {"Text": {}}}'
    else:
      content = "{}"

    mock_file.open.return_value.__enter__.return_value = io.StringIO(content)
    return mock_file

  mock_traversable.joinpath.side_effect = joinpath_side_effect

  manager = A2uiSchemaManager(test_version)

  assert manager.server_to_client_schema["defs"] == "server_defs"
  assert manager.catalog_schema["version"] == test_version
  assert "Text" in manager.catalog_schema["components"]


def test_schema_manager_fallback_local_assets(mock_importlib_resources):
  # Force importlib to fail
  mock_importlib_resources.side_effect = FileNotFoundError("Package not found")

  with (
      patch("os.path.exists") as mock_exists,
      patch("builtins.open", new_callable=MagicMock) as mock_open,
  ):

    def open_side_effect(path, *args, **kwargs):
      path_str = str(path)
      if "server_to_client.json" in path_str:
        return io.StringIO('{"defs": "local_server"}')
      elif "standard_catalog_definition.json" in path_str:
        return io.StringIO('{"components": {"LocalText": {}}}')
      raise FileNotFoundError(path)

    mock_open.side_effect = open_side_effect

    manager = A2uiSchemaManager(test_version)

    assert manager.server_to_client_schema["defs"] == "local_server"
    assert "LocalText" in manager.catalog_schema["components"]


def test_schema_manager_init_invalid_version():
  with pytest.raises(ValueError, match="Unknown A2UI specification version"):
    A2uiSchemaManager("invalid_version")


def test_schema_manager_init_custom_catalog(tmp_path, mock_importlib_resources):
  mock_files = mock_importlib_resources
  mock_traversable = MagicMock()
  mock_files.return_value = mock_traversable

  def joinpath_side_effect(path):
    mock_file = MagicMock()
    if path == "server_to_client.json":
      mock_file.open.return_value.__enter__.return_value = io.StringIO("{}")
    else:
      mock_file.open.return_value.__enter__.return_value = io.StringIO("{}")
    return mock_file

  mock_traversable.joinpath.side_effect = joinpath_side_effect

  d = tmp_path / "custom_catalog.json"
  d.write_text('{"components": {"Custom": {}}}', encoding="utf-8")

  manager = A2uiSchemaManager(test_version, custom_catalog_path=str(d))

  assert "Custom" in manager.catalog_schema["components"]


def test_get_pruned_catalog(mock_importlib_resources):
  mock_files = mock_importlib_resources
  mock_traversable = MagicMock()
  mock_files.return_value = mock_traversable

  def joinpath_side_effect(path):
    mock_file = MagicMock()
    if path == "standard_catalog_definition.json":
      content = json.dumps({"components": {"Text": {}, "Button": {}, "Image": {}}})
    else:
      content = "{}"
    mock_file.open.return_value.__enter__.return_value = io.StringIO(content)
    return mock_file

  mock_traversable.joinpath.side_effect = joinpath_side_effect

  manager = A2uiSchemaManager(test_version)

  # Test with explicit selection
  pruned = manager.get_pruned_catalog(["Text", "Button"])
  assert "Text" in pruned["components"]
  assert "Button" in pruned["components"]
  assert "Image" not in pruned["components"]

  # Test with None (default)
  full_catalog_none = manager.get_pruned_catalog()
  assert "Text" in full_catalog_none["components"]
  assert "Button" in full_catalog_none["components"]
  assert "Image" in full_catalog_none["components"]

  # Test with empty list
  full_catalog_empty = manager.get_pruned_catalog([])
  assert "Text" in full_catalog_empty["components"]
  assert "Button" in full_catalog_empty["components"]
  assert "Image" in full_catalog_empty["components"]


def test_get_pruned_catalog_filters_any_component(mock_importlib_resources):
  manager = A2uiSchemaManager("0.8")
  manager.catalog_schema = {
      "version": "0.8",
      "$defs": {
          "anyComponent": {
              "oneOf": [
                  {"$ref": "#/components/Text"},
                  {"$ref": "#/components/Button"},
                  {"$ref": "#/components/Image"},
              ]
          }
      },
      "components": {"Text": {}, "Button": {}, "Image": {}},
  }

  selected = ["Text"]
  pruned = manager.get_pruned_catalog(selected)

  assert "Text" in pruned["components"]
  assert "Button" not in pruned["components"]
  assert "Image" not in pruned["components"]

  if "$defs" in pruned and "anyComponent" in pruned["$defs"]:
    any_comp_one_of = pruned["$defs"]["anyComponent"]["oneOf"]
    assert len(any_comp_one_of) == 1
    assert any_comp_one_of[0]["$ref"] == "#/components/Text"


def test_generate_system_prompt(mock_importlib_resources):
  mock_files = mock_importlib_resources
  mock_traversable = MagicMock()
  mock_files.return_value = mock_traversable

  def joinpath_side_effect(path):
    mock_file = MagicMock()
    if path == "server_to_client.json":
      content = '{"type": "server_schema"}'
    elif path == "standard_catalog_definition.json":
      content = '{"components": {"Text": {}}}'
    else:
      content = "{}"
    mock_file.open.return_value.__enter__.return_value = io.StringIO(content)
    return mock_file

  mock_traversable.joinpath.side_effect = joinpath_side_effect

  manager = A2uiSchemaManager("0.8")
  prompt = manager.generate_system_prompt(
      "You are a helpful assistant.",
      "Manage workflow.",
      "Render UI.",
      ["Text"],
  )

  assert "You are a helpful assistant." in prompt
  assert "## Workflow Description:" in prompt
  assert "Manage workflow." in prompt
  assert "## UI Description:" in prompt
  assert "Render UI." in prompt
  assert "---BEGIN A2UI JSON SCHEMA---" in prompt
  assert "### Server To Client Schema:" in prompt
  assert '"type": "server_schema"' in prompt
  assert "### Catalog Schema:" in prompt
  assert "---END A2UI JSON SCHEMA---" in prompt
  assert '"Text":{}' in prompt.replace(" ", "")


def test_generate_system_prompt_with_examples(mock_importlib_resources):
  mock_files = mock_importlib_resources
  mock_traversable = MagicMock()
  mock_files.return_value = mock_traversable

  def joinpath_side_effect(path):
    mock_file = MagicMock()
    mock_file.open.return_value.__enter__.return_value = io.StringIO("{}")
    return mock_file

  mock_traversable.joinpath.side_effect = joinpath_side_effect

  manager = A2uiSchemaManager("0.8")

  # Test with examples
  examples = json.dumps([{"description": "example1", "code": "..."}])
  prompt = manager.generate_system_prompt("Role description", examples=examples)
  assert "## Examples:" in prompt
  assert '"example1"' in prompt

  # Test without examples
  prompt_no_examples = manager.generate_system_prompt("Role description")
  assert "## Examples:" not in prompt_no_examples


def test_generate_system_prompt_v0_9_common_types(mock_importlib_resources):
  mock_files = mock_importlib_resources
  mock_traversable = MagicMock()
  mock_files.return_value = mock_traversable

  def joinpath_side_effect(path):
    mock_file = MagicMock()
    content = "{}"
    if path == "common_types.json":
      content = '{"types": {"Common": {}}}'
    elif path == "server_to_client.json":
      content = '{"type": "server_schema"}'

    mock_file.open.return_value.__enter__.return_value = io.StringIO(content)
    return mock_file

  mock_traversable.joinpath.side_effect = joinpath_side_effect

  # Initialize with version 0.9 which expects common types
  manager = A2uiSchemaManager("0.9")

  prompt = manager.generate_system_prompt("Role")

  assert "### Common Types Schema:" in prompt
  assert '"types":{"Common":{}}' in prompt.replace(" ", "").replace("\n", "")


def test_generate_system_prompt_minimal_args(mock_importlib_resources):
  mock_files = mock_importlib_resources
  mock_traversable = MagicMock()
  mock_files.return_value = mock_traversable
  mock_traversable.joinpath.return_value.open.return_value.__enter__.return_value = (
      io.StringIO("{}")
  )

  manager = A2uiSchemaManager("0.8")
  prompt = manager.generate_system_prompt("Just Role")

  # Check that optional sections are missing
  assert "## Workflow Description:" not in prompt
  assert "## UI Description:" not in prompt
  assert "## Examples:" not in prompt
  assert "Just Role" in prompt
  assert "---BEGIN A2UI JSON SCHEMA---" in prompt

  def test_schema_modifiers(self, mock_importlib_resources):
    """Verifies that schema modifiers are applied correctly."""
    mock_files = mock_importlib_resources
    mock_traversable = MagicMock()
    mock_files.return_value = mock_traversable

    def joinpath_side_effect(path):
      mock_file = MagicMock()
      # Return valid JSON for all schema loads
      mock_file.open.return_value.__enter__.return_value = io.StringIO(
          '{"type": "object", "properties": {"original": true}}'
      )
      return mock_file

    mock_traversable.joinpath.side_effect = joinpath_side_effect

    def dummy_modifier(schema):
      if "properties" not in schema:
        schema["properties"] = {}
      schema["properties"]["modified"] = True
      return schema

    manager = A2uiSchemaManager("0.8", schema_modifiers=[dummy_modifier])

    assert manager.server_to_client_schema["properties"]["modified"] is True
    assert manager.catalog_schema["properties"]["modified"] is True
    # Bundle should also reflect changes (indirectly, as it uses deepcopy of loaded components)
    # The bundled schema is wrapped in array {"type": "array", "items": ...}
    bundled_item = manager.bundled_schema["items"]
    # server_to_client_schema properties are base for 0.8 bundling
    assert bundled_item["properties"]["modified"] is True
