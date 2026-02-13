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
import io
import pytest
import json
import os
from unittest.mock import patch, MagicMock, PropertyMock
from a2ui.inference.schema.manager import A2uiSchemaManager, A2uiCatalog, CustomCatalogConfig
from a2ui.inference.schema.constants import (
    CATALOG_COMPONENTS_KEY,
    INLINE_CATALOG_NAME,
    BASIC_CATALOG_NAME,
)
from a2ui.extension.a2ui_extension import INLINE_CATALOGS_KEY, SUPPORTED_CATALOG_IDS_KEY

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
      content = (
          '{"$schema": "https://json-schema.org/draft/2020-12/schema", "version":'
          ' "0.8", "defs": "server_defs"}'
      )
    elif path == "standard_catalog_definition.json":
      content = (
          '{"$schema": "https://json-schema.org/draft/2020-12/schema", "version":'
          ' "0.8", "components": {"Text": {}}}'
      )
    else:
      content = '{"$schema": "https://json-schema.org/draft/2020-12/schema"}'

    mock_file.open.return_value.__enter__.return_value = io.StringIO(content)
    return mock_file

  mock_traversable.joinpath.side_effect = joinpath_side_effect

  manager = A2uiSchemaManager(test_version)

  assert manager._server_to_client_schema["defs"] == "server_defs"
  # Basic catalog might have a URI-based ID if not explicitly matched
  # So we check if any catalog exists
  assert len(manager._supported_catalogs) >= 1
  # The first one should be the basic one
  catalog = list(manager._supported_catalogs.values())[0]
  assert catalog.catalog_schema["version"] == test_version
  assert "Text" in catalog.catalog_schema["components"]


def test_schema_manager_fallback_local_assets(mock_importlib_resources):
  # Force importlib to fail
  mock_importlib_resources.side_effect = FileNotFoundError("Package not found")

  with (
      patch("os.path.exists") as mock_exists,
      patch("builtins.open", new_callable=MagicMock) as mock_open,
  ):

    def open_side_effect(path, *args, **kwargs):
      path_str = str(path)
      if "server_to_client" in path_str:
        return io.StringIO('{"defs": "local_server"}')
      elif "standard_catalog" in path_str or "catalog" in path_str:
        return io.StringIO('{"catalogId": "basic", "components": {"LocalText": {}}}')
      raise FileNotFoundError(path)

    mock_open.side_effect = open_side_effect

    manager = A2uiSchemaManager(test_version)

    assert manager._server_to_client_schema["defs"] == "local_server"
    catalog = list(manager._supported_catalogs.values())[0]
    assert "LocalText" in catalog.catalog_schema["components"]


def test_schema_manager_init_invalid_version():
  with pytest.raises(ValueError, match="Unknown A2UI specification version"):
    A2uiSchemaManager("invalid_version")


def test_schema_manager_init_custom_catalog(tmp_path, mock_importlib_resources):
  mock_files = mock_importlib_resources
  mock_traversable = MagicMock()
  mock_files.return_value = mock_traversable

  def joinpath_side_effect(path):
    mock_file = MagicMock()
    if "server_to_client" in path:
      mock_file.open.return_value.__enter__.return_value = io.StringIO(
          '{"$schema": "https://json-schema.org/draft/2020-12/schema"}'
      )
    elif "catalog" in path:
      mock_file.open.return_value.__enter__.return_value = io.StringIO(
          '{"$schema": "https://json-schema.org/draft/2020-12/schema", "catalogId":'
          ' "basic", "components": {}}'
      )
    else:
      mock_file.open.return_value.__enter__.return_value = io.StringIO(
          '{"$schema": "https://json-schema.org/draft/2020-12/schema"}'
      )
    return mock_file

  mock_traversable.joinpath.side_effect = joinpath_side_effect

  d = tmp_path / "custom_catalog.json"
  d.write_text(
      '{"$schema": "https://json-schema.org/draft/2020-12/schema", "catalogId":'
      ' "Custom", "components": {"Custom": {}}}',
      encoding="utf-8",
  )

  config = CustomCatalogConfig(name="Custom", catalog_path=str(d))
  manager = A2uiSchemaManager(test_version, custom_catalogs=[config])

  assert len(manager._supported_catalogs) == 2
  assert "basic" in manager._supported_catalogs
  assert "Custom" in manager._supported_catalogs
  assert "Custom" in manager._supported_catalogs["Custom"].catalog_schema["components"]


def test_generate_system_prompt(mock_importlib_resources):
  mock_files = mock_importlib_resources
  mock_traversable = MagicMock()
  mock_files.return_value = mock_traversable

  def joinpath_side_effect(path):
    mock_file = MagicMock()
    if "server_to_client" in path:
      content = (
          '{"$schema": "https://json-schema.org/draft/2020-12/schema", "type":'
          ' "object", "properties": {"server_schema": {"type": "string"}}}'
      )
    elif "catalog" in path:
      content = (
          '{"$schema": "https://json-schema.org/draft/2020-12/schema", "catalogId":'
          ' "basic", "components": {"Text": {}}}'
      )
    else:
      content = '{"$schema": "https://json-schema.org/draft/2020-12/schema"}'
    mock_file.open.return_value.__enter__.return_value = io.StringIO(content)
    return mock_file

  mock_traversable.joinpath.side_effect = joinpath_side_effect

  manager = A2uiSchemaManager("0.8")
  prompt = manager.generate_system_prompt(
      role_description="You are a helpful assistant.",
      workflow_description="Manage workflow.",
      ui_description="Render UI.",
      client_ui_capabilities={SUPPORTED_CATALOG_IDS_KEY: ["basic"]},
      allowed_components=["Text"],
      include_schema=True,
  )

  assert "You are a helpful assistant." in prompt
  assert "## Workflow Description:" in prompt
  assert "Manage workflow." in prompt
  assert "## UI Description:" in prompt
  assert "RENDERUI." in prompt.replace(" ", "").upper()
  assert "---BEGIN A2UI JSON SCHEMA---" in prompt
  assert "### Server To Client Schema:" in prompt
  assert "### Catalog Schema" in prompt
  assert "---END A2UI JSON SCHEMA---" in prompt
  assert '"Text":{}' in prompt.replace(" ", "")


def test_generate_system_prompt_with_examples(mock_importlib_resources):
  mock_files = mock_importlib_resources
  mock_traversable = MagicMock()
  mock_files.return_value = mock_traversable

  def joinpath_side_effect(path):
    mock_file = MagicMock()
    if "catalog" in path:
      content = '{"catalogId": "basic", "components": {}}'
    else:
      content = "{}"
    mock_file.open.return_value.__enter__.return_value = io.StringIO(content)
    return mock_file

  mock_traversable.joinpath.side_effect = joinpath_side_effect

  manager = A2uiSchemaManager("0.8")

  # Test with examples
  with patch("os.path.isdir", return_value=True):
    with patch.object(
        A2uiCatalog,
        "load_examples",
        return_value="---BEGIN example1---\n{}\n---END example1---",
    ):
      prompt = manager.generate_system_prompt("Role description", include_examples=True)
      assert "### Examples" in prompt
      assert "example1" in prompt

  # Test without examples
  prompt_no_examples = manager.generate_system_prompt("Role description")
  assert "## Examples:" not in prompt_no_examples


def test_generate_system_prompt_v0_9_common_types(mock_importlib_resources):
  mock_files = mock_importlib_resources
  mock_traversable = MagicMock()
  mock_files.return_value = mock_traversable

  def joinpath_side_effect(path):
    mock_file = MagicMock()
    content = '{"$schema": "https://json-schema.org/draft/2020-12/schema"}'
    if path == "common_types.json":
      content = (
          '{"$schema": "https://json-schema.org/draft/2020-12/schema", "types":'
          ' {"Common": {}}}'
      )
    elif "server_to_client" in path:
      content = (
          '{"$schema": "https://json-schema.org/draft/2020-12/schema", "type":'
          ' "object", "properties": {"server_schema": {"type": "string"}}}'
      )
    elif "catalog" in path:
      content = (
          '{"$schema": "https://json-schema.org/draft/2020-12/schema", "catalogId":'
          ' "basic", "components": {}}'
      )

    mock_file.open.return_value.__enter__.return_value = io.StringIO(content)
    return mock_file

  mock_traversable.joinpath.side_effect = joinpath_side_effect

  # Initialize with version 0.9 which expects common types
  manager = A2uiSchemaManager("0.9")

  prompt = manager.generate_system_prompt("Role", include_schema=True)

  assert "### Common Types Schema:" in prompt
  assert '"types":{"Common":{}}' in prompt.replace(" ", "").replace("\n", "")


def test_generate_system_prompt_minimal_args(mock_importlib_resources):
  mock_files = mock_importlib_resources
  mock_traversable = MagicMock()
  mock_files.return_value = mock_traversable

  def joinpath_side_effect(path):
    mock_file = MagicMock()
    if "catalog" in path:
      content = '{"catalogId": "basic", "components": {}}'
    else:
      content = "{}"
    mock_file.open.return_value.__enter__.return_value = io.StringIO(content)
    return mock_file

  mock_traversable.joinpath.side_effect = joinpath_side_effect

  manager = A2uiSchemaManager("0.8")
  prompt = manager.generate_system_prompt("Just Role")

  # Check that optional sections are missing
  assert "## Workflow Description:" not in prompt
  assert "## UI Description:" not in prompt
  assert "## Examples:" not in prompt
  assert "Just Role" in prompt
  assert "---BEGIN A2UI JSON SCHEMA---" not in prompt


def test_generate_system_prompt_with_inline_catalog(mock_importlib_resources):
  mock_files = mock_importlib_resources
  mock_traversable = MagicMock()
  mock_files.return_value = mock_traversable

  def joinpath_side_effect(path):
    mock_file = MagicMock()
    content = '{"$schema": "https://json-schema.org/draft/2020-12/schema"}'
    if "catalog" in path:
      content = (
          '{"$schema": "https://json-schema.org/draft/2020-12/schema", "catalogId":'
          ' "basic", "components": {}}'
      )
    mock_file.open.return_value.__enter__.return_value = io.StringIO(content)
    return mock_file

  mock_traversable.joinpath.side_effect = joinpath_side_effect
  manager = A2uiSchemaManager("0.8", accepts_inline_catalogs=True)
  inline_schema = {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "catalogId": "id_inline",
      "components": {"Button": {}},
  }
  client_caps = {INLINE_CATALOGS_KEY: [inline_schema]}

  prompt = manager.generate_system_prompt(
      "Role", client_ui_capabilities=client_caps, include_schema=True
  )

  assert "Role" in prompt
  assert "---BEGIN A2UI JSON SCHEMA---" in prompt
  assert (
      '### Catalog Schema:\n{\n  "$schema":'
      ' "https://json-schema.org/draft/2020-12/schema",\n  "catalogId": "id_inline"'
      in prompt
  )
  assert '"Button": {}' in prompt


def test_determine_catalog_logic():
  basic = A2uiCatalog(
      version="0.9",
      name=BASIC_CATALOG_NAME,
      s2c_schema={},
      common_types_schema={},
      catalog_schema={
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "catalogId": "id_basic",
      },
  )
  custom1 = A2uiCatalog(
      version="0.9",
      name="custom1",
      s2c_schema={},
      common_types_schema={},
      catalog_schema={
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "catalogId": "id_custom1",
      },
  )
  custom2 = A2uiCatalog(
      version="0.9",
      name="custom2",
      s2c_schema={},
      common_types_schema={},
      catalog_schema={
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "catalogId": "id_custom2",
      },
  )

  # Create a mock manager with these catalogs
  manager = MagicMock(spec=A2uiSchemaManager)
  manager._supported_catalogs = {
      basic.catalog_id: basic,
      custom1.catalog_id: custom1,
      custom2.catalog_id: custom2,
  }
  manager._version = "0.9"
  manager._server_to_client_schema = {"s2c": "schema"}
  manager._common_types_schema = {"common": "types"}
  manager._basic_catalog = basic
  manager._accepts_inline_catalogs = True

  # Rule 1: If supported_catalog_ids is not provided, return the basic catalog
  assert A2uiSchemaManager._determine_catalog(manager, {}) == basic
  assert A2uiSchemaManager._determine_catalog(manager, None) == basic

  # Rule 2: Exception if both inline and supported IDs are provided
  with pytest.raises(ValueError, match="Only one is allowed"):
    A2uiSchemaManager._determine_catalog(
        manager,
        {
            INLINE_CATALOGS_KEY: [{"inline": "catalog"}],
            SUPPORTED_CATALOG_IDS_KEY: ["id_custom1"],
        },
    )

  # Rule 3: Inline catalog loading
  inline_schema = {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "catalogId": "id_inline",
      "components": {},
  }
  # Mock A2uiCatalog.resolve_schema
  with patch.object(A2uiCatalog, "resolve_schema", return_value=inline_schema):
    catalog_inline = A2uiSchemaManager._determine_catalog(
        manager, {INLINE_CATALOGS_KEY: [inline_schema]}
    )
    assert catalog_inline.name == INLINE_CATALOG_NAME
    assert catalog_inline.catalog_schema == inline_schema
    assert catalog_inline.s2c_schema == manager._server_to_client_schema
    assert catalog_inline.common_types_schema == manager._common_types_schema

  # Rule 3b: Inline catalog loading should fail if not accepted.
  manager._accepts_inline_catalogs = False
  with pytest.raises(ValueError, match="the agent does not accept inline catalogs"):
    A2uiSchemaManager._determine_catalog(
        manager, {INLINE_CATALOGS_KEY: [inline_schema]}
    )
  manager._accepts_inline_catalogs = True

  # Rule 4: Otherwise, find the intersection, return any catalog that matches.
  # The priority is determined by the order in supported_catalog_ids.
  assert (
      A2uiSchemaManager._determine_catalog(
          manager, {SUPPORTED_CATALOG_IDS_KEY: ["id_custom1"]}
      )
      == custom1
  )
  assert (
      A2uiSchemaManager._determine_catalog(
          manager, {SUPPORTED_CATALOG_IDS_KEY: ["id_custom2", "id_custom1"]}
      )
      == custom2
  )  # returns first match in supported list
  assert (
      A2uiSchemaManager._determine_catalog(
          manager, {SUPPORTED_CATALOG_IDS_KEY: ["id_basic", "id_custom2"]}
      )
      == basic
  )  # returns first match in supported list (basic is first)

  # Rule 5: Raise ValueError if supported list is non-empty but no match exists
  with pytest.raises(ValueError, match="No supported catalog found"):
    A2uiSchemaManager._determine_catalog(
        manager, {SUPPORTED_CATALOG_IDS_KEY: ["id_not_exists"]}
    )

  assert (
      A2uiSchemaManager._determine_catalog(
          manager, {SUPPORTED_CATALOG_IDS_KEY: ["id_basic"]}
      )
      == basic
  )
