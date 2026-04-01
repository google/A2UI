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
from a2ui.core.schema.manager import A2uiSchemaManager, A2uiCatalog, CatalogConfig
from a2ui.basic_catalog import BasicCatalog
from a2ui.basic_catalog.constants import BASIC_CATALOG_NAME
from a2ui.core.schema.constants import (
    DEFAULT_WORKFLOW_RULES,
    INLINE_CATALOG_NAME,
    VERSION_0_8,
    VERSION_0_9,
)
from a2ui.core.schema.constants import (
    A2UI_SCHEMA_BLOCK_START,
    A2UI_SCHEMA_BLOCK_END,
    INLINE_CATALOGS_KEY,
    SUPPORTED_CATALOG_IDS_KEY,
)


@pytest.fixture
def mock_importlib_resources():
  with patch("importlib.resources.files") as mock_files:
    yield mock_files


def test_schema_manager_init_valid_version(mock_importlib_resources):
  mock_files = mock_importlib_resources
  mock_traversable = MagicMock()

  def files_side_effect(package):
    if package == "a2ui.assets":
      return mock_traversable
    return MagicMock()

  mock_files.side_effect = files_side_effect

  # Mock file open calls for server_to_client and catalog
  def joinpath_side_effect(path):
    if path == VERSION_0_8:
      return mock_traversable

    mock_file = MagicMock()
    if path == "server_to_client.json":
      content = (
          '{"$schema": "https://json-schema.org/draft/2020-12/schema", "version":'
          f' "{VERSION_0_8}", "defs": "server_defs"}}'
      )
    elif path == "standard_catalog_definition.json":
      content = (
          '{"$schema": "https://json-schema.org/draft/2020-12/schema", "version":'
          f' "{VERSION_0_8}", "components": {{"Text": {{}}}}}}'
      )
    else:
      content = '{"$schema": "https://json-schema.org/draft/2020-12/schema"}'

    mock_file.open.return_value.__enter__.return_value = io.StringIO(content)
    return mock_file

  mock_traversable.joinpath.side_effect = joinpath_side_effect

  manager = A2uiSchemaManager(
      VERSION_0_8, catalogs=[BasicCatalog.get_config(VERSION_0_8)]
  )

  assert manager._server_to_client_schema["defs"] == "server_defs"
  # Basic catalog might have a URI-based ID if not explicitly matched
  # So we check if any catalog exists
  assert len(manager._supported_catalogs) >= 1
  # The first one should be the basic one
  catalog = manager._supported_catalogs[0]
  assert catalog.catalog_schema["version"] == VERSION_0_8
  assert "Text" in catalog.catalog_schema["components"]


def test_schema_manager_init_invalid_version():
  with pytest.raises(ValueError, match="Unknown A2UI specification version"):
    A2uiSchemaManager("invalid_version")


def test_schema_manager_fallback_local_assets(mock_importlib_resources):
  # Force importlib to fail
  # Note: A2UI_ASSET_PACKAGE is "a2ui.assets"
  mock_importlib_resources.side_effect = FileNotFoundError("Package not found")

  with (
      patch("os.path.exists", return_value=True),
      patch("builtins.open", new_callable=MagicMock) as mock_open,
  ):

    def open_side_effect(path, *args, **kwargs):
      path_str = str(path)
      if "server_to_client" in path_str:
        return io.StringIO(
            '{"$schema": "https://json-schema.org/draft/2020-12/schema", "defs":'
            ' "local_server"}'
        )
      elif "standard_catalog" in path_str or "catalog" in path_str:
        return io.StringIO(
            '{"$schema": "https://json-schema.org/draft/2020-12/schema",'
            ' "catalogId": "basic", "components": {"LocalText": {}}}'
        )
      raise FileNotFoundError(path)

    mock_open.side_effect = open_side_effect

    manager = A2uiSchemaManager(
        VERSION_0_8, catalogs=[BasicCatalog.get_config(VERSION_0_8)]
    )

    assert manager._server_to_client_schema["defs"] == "local_server"
    assert len(manager._supported_catalogs) >= 1
    catalog = manager._supported_catalogs[0]
    assert "LocalText" in catalog.catalog_schema["components"]


def test_schema_manager_init_custom_catalog(tmp_path, mock_importlib_resources):
  mock_files = mock_importlib_resources
  mock_traversable = MagicMock()
  mock_files.return_value = mock_traversable

  def joinpath_side_effect(path):
    if path == VERSION_0_8:
      return mock_traversable

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

  config = CatalogConfig.from_path(name="Custom", catalog_path=str(d))
  manager = A2uiSchemaManager(
      VERSION_0_8, catalogs=[BasicCatalog.get_config(VERSION_0_8), config]
  )

  assert len(manager._supported_catalogs) == 2
  assert manager._supported_catalogs[0].name == BASIC_CATALOG_NAME
  assert manager._supported_catalogs[1].name == "Custom"
  assert "Custom" in manager._supported_catalogs[1].catalog_schema["components"]


def test_generate_system_prompt(mock_importlib_resources):
  mock_files = mock_importlib_resources
  mock_traversable = MagicMock()
  mock_files.return_value = mock_traversable

  def joinpath_side_effect(path):
    if path == VERSION_0_8 or path == VERSION_0_9:

      return mock_traversable

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

  manager = A2uiSchemaManager(
      VERSION_0_8, catalogs=[BasicCatalog.get_config(VERSION_0_8)]
  )

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
  assert A2UI_SCHEMA_BLOCK_START in prompt
  assert "### Server To Client Schema:" in prompt
  assert "### Catalog Schema" in prompt
  assert A2UI_SCHEMA_BLOCK_END in prompt
  assert '"Text":{}' in prompt.replace(" ", "")


def test_generate_system_prompt_with_examples(mock_importlib_resources):
  mock_files = mock_importlib_resources
  mock_traversable = MagicMock()
  mock_files.return_value = mock_traversable

  def joinpath_side_effect(path):
    if path == VERSION_0_8:

      return mock_traversable

    mock_file = MagicMock()
    if "catalog" in path:
      content = '{"catalogId": "basic", "components": {}}'
    else:
      content = "{}"
    mock_file.open.return_value.__enter__.return_value = io.StringIO(content)
    return mock_file

  mock_traversable.joinpath.side_effect = joinpath_side_effect

  manager = A2uiSchemaManager(
      VERSION_0_8, catalogs=[BasicCatalog.get_config(VERSION_0_8)]
  )

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
    if path == VERSION_0_9:

      return mock_traversable

    mock_file = MagicMock()
    content = '{"$schema": "https://json-schema.org/draft/2020-12/schema"}'
    if path == "common_types.json":
      content = (
          '{"$schema": "https://json-schema.org/draft/2020-12/schema", "$defs":'
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
          ' "basic", "components": {}, "$defs": {"test": {"$ref":'
          ' "common_types.json#/$defs/Common"}}}'
      )
    mock_file.open.return_value.__enter__.return_value = io.StringIO(content)
    return mock_file

  mock_traversable.joinpath.side_effect = joinpath_side_effect

  # Initialize with version 0.9 which expects common types
  manager = A2uiSchemaManager(
      VERSION_0_9, catalogs=[BasicCatalog.get_config(VERSION_0_9)]
  )

  prompt = manager.generate_system_prompt("Role", include_schema=True)

  assert "### Common Types Schema:" in prompt
  assert '"$defs":{"Common":{}}' in prompt.replace(" ", "").replace("\n", "")


def test_generate_system_prompt_minimal_args(mock_importlib_resources):
  mock_files = mock_importlib_resources
  mock_traversable = MagicMock()
  mock_files.return_value = mock_traversable

  def joinpath_side_effect(path):
    if path == VERSION_0_8:
      return mock_traversable

    mock_file = MagicMock()
    if "catalog" in path:
      content = '{"catalogId": "basic", "components": {}}'
    else:
      content = "{}"
    mock_file.open.return_value.__enter__.return_value = io.StringIO(content)
    return mock_file

  mock_traversable.joinpath.side_effect = joinpath_side_effect

  manager = A2uiSchemaManager(
      VERSION_0_8, catalogs=[BasicCatalog.get_config(VERSION_0_8)]
  )

  prompt = manager.generate_system_prompt("Just Role")

  # Check that default workflow description is present even with no args
  assert "## Workflow Description:" in prompt
  assert DEFAULT_WORKFLOW_RULES in prompt
  assert "## UI Description:" not in prompt
  assert "## Examples:" not in prompt
  assert "Just Role" in prompt
  assert A2UI_SCHEMA_BLOCK_START not in prompt


def test_generate_system_prompt_custom_workflow_appending(mock_importlib_resources):
  mock_files = mock_importlib_resources
  mock_traversable = MagicMock()
  mock_files.return_value = mock_traversable

  def joinpath_side_effect(path):
    if path == VERSION_0_8:
      return mock_traversable

    mock_file = MagicMock()
    if "catalog" in path:
      content = '{"catalogId": "basic", "components": {}}'
    else:
      content = "{}"
    mock_file.open.return_value.__enter__.return_value = io.StringIO(content)
    return mock_file

  mock_traversable.joinpath.side_effect = joinpath_side_effect

  manager = A2uiSchemaManager(
      VERSION_0_8, catalogs=[BasicCatalog.get_config(VERSION_0_8)]
  )

  custom_rule = "Custom Rule Content"
  prompt = manager.generate_system_prompt("Role", workflow_description=custom_rule)

  assert "## Workflow Description:" in prompt
  assert DEFAULT_WORKFLOW_RULES in prompt
  assert custom_rule in prompt
  # Ensure custom rule is appended to default
  assert prompt.index(DEFAULT_WORKFLOW_RULES) < prompt.index(custom_rule)


def test_generate_system_prompt_with_inline_catalog(mock_importlib_resources):
  mock_files = mock_importlib_resources
  mock_traversable = MagicMock()
  mock_files.return_value = mock_traversable

  def joinpath_side_effect(path):
    if path == VERSION_0_8:

      return mock_traversable

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
  manager = A2uiSchemaManager(
      VERSION_0_8,
      catalogs=[BasicCatalog.get_config(VERSION_0_8)],
      accepts_inline_catalogs=True,
  )

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
  assert A2UI_SCHEMA_BLOCK_START in prompt
  # Inline catalog is merged onto the base catalog (catalogId: "basic")
  assert "### Catalog Schema:" in prompt
  assert '"catalogId": "basic"' in prompt
  assert '"Button": {}' in prompt


def test_select_catalog_logic():
  basic = A2uiCatalog(
      version=VERSION_0_9,
      name=BASIC_CATALOG_NAME,
      s2c_schema={},
      common_types_schema={},
      catalog_schema={
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "catalogId": "id_basic",
      },
  )
  custom1 = A2uiCatalog(
      version=VERSION_0_9,
      name="custom1",
      s2c_schema={},
      common_types_schema={},
      catalog_schema={
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "catalogId": "id_custom1",
      },
  )
  custom2 = A2uiCatalog(
      version=VERSION_0_9,
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
  manager._supported_catalogs = [
      basic,
      custom1,
      custom2,
  ]
  manager._version = VERSION_0_9

  manager._server_to_client_schema = {"s2c": "schema"}
  manager._common_types_schema = {"common": "types"}
  manager._accepts_inline_catalogs = True

  # Rule 1: If supported_catalog_ids is not provided, return the basic catalog
  assert A2uiSchemaManager._select_catalog(manager, {}) == basic
  assert A2uiSchemaManager._select_catalog(manager, None) == basic

  # Rule 2: Both inline and supported IDs are allowed (supportedCatalogIds
  # selects the base catalog, inlineCatalogs extend it).
  inline_with_supported = {
      INLINE_CATALOGS_KEY: [{"components": {"Custom": {}}}],
      SUPPORTED_CATALOG_IDS_KEY: ["id_custom1"],
  }
  # Need components on the base catalog for merging to work
  custom1_with_components = A2uiCatalog(
      version=VERSION_0_9,
      name="custom1",
      s2c_schema={},
      common_types_schema={},
      catalog_schema={
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "catalogId": "id_custom1",
          "components": {"Base": {}},
      },
  )
  manager._supported_catalogs[1] = custom1_with_components
  manager._apply_modifiers = MagicMock(side_effect=lambda x: x)
  catalog_both = A2uiSchemaManager._select_catalog(manager, inline_with_supported)
  assert catalog_both.name == INLINE_CATALOG_NAME
  # Base catalog's components are preserved and inline components are merged
  assert "Base" in catalog_both.catalog_schema["components"]
  assert "Custom" in catalog_both.catalog_schema["components"]
  assert catalog_both.catalog_schema["catalogId"] == "id_custom1"

  # Rule 3: Inline catalog loading (merges onto base)
  basic_with_components = A2uiCatalog(
      version=VERSION_0_9,
      name=BASIC_CATALOG_NAME,
      s2c_schema={},
      common_types_schema={},
      catalog_schema={
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "catalogId": "id_basic",
          "components": {"Text": {}},
      },
  )
  manager._supported_catalogs[0] = basic_with_components
  inline_schema = {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "catalogId": "id_inline",
      "components": {"Button": {}},
  }
  manager._apply_modifiers = MagicMock(return_value=inline_schema)
  catalog_inline = A2uiSchemaManager._select_catalog(
      manager, {INLINE_CATALOGS_KEY: [inline_schema]}
  )
  assert catalog_inline.name == INLINE_CATALOG_NAME
  # Merged: base components + inline components
  assert "Text" in catalog_inline.catalog_schema["components"]
  assert "Button" in catalog_inline.catalog_schema["components"]
  assert catalog_inline.s2c_schema == manager._server_to_client_schema
  assert catalog_inline.common_types_schema == manager._common_types_schema

  # Rule 3b: Inline catalog loading should fail if not accepted.
  manager._accepts_inline_catalogs = False
  with pytest.raises(ValueError, match="the agent does not accept inline catalogs"):
    A2uiSchemaManager._select_catalog(manager, {INLINE_CATALOGS_KEY: [inline_schema]})
  manager._accepts_inline_catalogs = True

  # Restore original catalogs for remaining tests
  manager._supported_catalogs = [basic, custom1, custom2]

  # Rule 4: Otherwise, find the intersection, return any catalog that matches.
  # The priority is determined by the order in supported_catalog_ids.
  assert (
      A2uiSchemaManager._select_catalog(
          manager, {SUPPORTED_CATALOG_IDS_KEY: ["id_custom1"]}
      )
      == custom1
  )
  assert (
      A2uiSchemaManager._select_catalog(
          manager, {SUPPORTED_CATALOG_IDS_KEY: ["id_custom2", "id_custom1"]}
      )
      == custom2
  )  # returns first match in supported list
  assert (
      A2uiSchemaManager._select_catalog(
          manager, {SUPPORTED_CATALOG_IDS_KEY: ["id_basic", "id_custom2"]}
      )
      == basic
  )  # returns first match in supported list (basic is first)

  # Rule 5: Raise ValueError if supported list is non-empty but no match exists
  with pytest.raises(ValueError, match="No client-supported catalog found"):
    A2uiSchemaManager._select_catalog(
        manager, {SUPPORTED_CATALOG_IDS_KEY: ["id_not_exists"]}
    )

  assert (
      A2uiSchemaManager._select_catalog(
          manager, {SUPPORTED_CATALOG_IDS_KEY: ["id_basic"]}
      )
      == basic
  )
