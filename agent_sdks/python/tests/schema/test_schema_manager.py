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
from a2ui.schema.manager import A2uiSchemaManager, A2uiCatalog, CatalogConfig
from a2ui.basic_catalog import BasicCatalog
from a2ui.basic_catalog.constants import BASIC_CATALOG_NAME
from a2ui.schema.constants import (
    DEFAULT_WORKFLOW_RULES,
    TOOL_WORKFLOW_RULES,
    INLINE_CATALOG_NAME,
    VERSION_0_8,
    VERSION_0_9,
)
from a2ui.schema.constants import (
    A2UI_SCHEMA_BLOCK_START,
    A2UI_SCHEMA_BLOCK_END,
    INLINE_CATALOGS_KEY,
    SUPPORTED_CATALOG_IDS_KEY,
)
from a2ui.schema.output_mode import A2UIOutputMode


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


# --- Tests for output_mode parameter ---


class TestOutputMode:
  """Tests for the output_mode parameter on generate_system_prompt()."""

  @pytest.fixture
  def manager(self):
    return A2uiSchemaManager(
        VERSION_0_8,
        catalogs=[BasicCatalog.get_config(VERSION_0_8)],
    )

  def test_default_mode_is_text(self, manager):
    """Default output_mode is TEXT, uses DEFAULT_WORKFLOW_RULES."""
    prompt = manager.generate_system_prompt(
        role_description="Test agent",
    )
    assert "send_a2ui_json_to_client" not in prompt

  def test_text_mode_includes_schema(self, manager):
    """TEXT mode includes schema when include_schema=True."""
    prompt = manager.generate_system_prompt(
        role_description="Test agent",
        include_schema=True,
        output_mode=A2UIOutputMode.TEXT,
    )
    assert "BEGIN A2UI" in prompt or "A2UI JSON SCHEMA" in prompt

  def test_tool_mode_excludes_schema(self, manager):
    """TOOL mode forces include_schema=False even when requested."""
    prompt = manager.generate_system_prompt(
        role_description="Test agent",
        include_schema=True,
        output_mode=A2UIOutputMode.TOOL,
    )
    assert "BEGIN A2UI" not in prompt
    assert "A2UI JSON SCHEMA" not in prompt

  def test_tool_mode_excludes_examples(self, manager):
    """TOOL mode forces include_examples=False even when requested."""
    prompt = manager.generate_system_prompt(
        role_description="Test agent",
        include_examples=True,
        output_mode=A2UIOutputMode.TOOL,
    )
    assert "Examples:" not in prompt

  def test_tool_mode_uses_tool_rules(self, manager):
    """TOOL mode uses TOOL_WORKFLOW_RULES."""
    prompt = manager.generate_system_prompt(
        role_description="Test agent",
        output_mode=A2UIOutputMode.TOOL,
    )
    assert "send_a2ui_json_to_client" in prompt
    assert "call the" in prompt

  def test_text_mode_uses_default_rules(self, manager):
    """TEXT mode uses DEFAULT_WORKFLOW_RULES."""
    prompt = manager.generate_system_prompt(
        role_description="Test agent",
        output_mode=A2UIOutputMode.TEXT,
    )
    assert "send_a2ui_json_to_client" not in prompt

  def test_tool_mode_preserves_role_description(self, manager):
    """TOOL mode still includes the role description."""
    role = "You are a data analytics dashboard agent."
    prompt = manager.generate_system_prompt(
        role_description=role,
        output_mode=A2UIOutputMode.TOOL,
    )
    assert role in prompt

  def test_tool_mode_preserves_ui_description(self, manager):
    """TOOL mode still includes ui_description."""
    ui_desc = "Render KPI metrics as Card grids."
    prompt = manager.generate_system_prompt(
        role_description="Test agent",
        ui_description=ui_desc,
        output_mode=A2UIOutputMode.TOOL,
    )
    assert ui_desc in prompt

  def test_tool_mode_preserves_workflow_description(self, manager):
    """TOOL mode appends workflow_description after tool rules."""
    workflow = "Always show last 7 days of data."
    prompt = manager.generate_system_prompt(
        role_description="Test agent",
        workflow_description=workflow,
        output_mode=A2UIOutputMode.TOOL,
    )
    assert workflow in prompt
    assert "send_a2ui_json_to_client" in prompt

  def test_backward_compatible_no_output_mode(self, manager):
    """Not passing output_mode produces identical output to before."""
    prompt_before = manager.generate_system_prompt(
        role_description="Test agent",
    )
    prompt_explicit = manager.generate_system_prompt(
        role_description="Test agent",
        output_mode=A2UIOutputMode.TEXT,
    )
    assert prompt_before == prompt_explicit

  def test_tool_mode_differs_from_text(self, manager):
    """TOOL mode produces different output than TEXT mode."""
    text_prompt = manager.generate_system_prompt(
        role_description="Test agent",
        output_mode=A2UIOutputMode.TEXT,
    )
    tool_prompt = manager.generate_system_prompt(
        role_description="Test agent",
        output_mode=A2UIOutputMode.TOOL,
    )
    assert text_prompt != tool_prompt

  def test_tool_rules_has_top_down_ordering(self):
    """TOOL_WORKFLOW_RULES preserves the top-down ordering requirement."""
    assert "root" in TOOL_WORKFLOW_RULES
    assert (
        "Parent components MUST appear before their child" in TOOL_WORKFLOW_RULES
    )

  def test_tool_mode_with_v09(self):
    """TOOL mode works with v0.9 catalogs."""
    manager = A2uiSchemaManager(
        VERSION_0_9,
        catalogs=[BasicCatalog.get_config(VERSION_0_9)],
    )
    prompt = manager.generate_system_prompt(
        role_description="Test agent",
        include_schema=True,
        output_mode=A2UIOutputMode.TOOL,
    )
    assert "send_a2ui_json_to_client" in prompt
    assert "BEGIN A2UI" not in prompt
