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
import os
import pytest
from typing import Any, Dict, List
from a2ui.core.schema.catalog import A2uiCatalog
from a2ui.core.schema.constants import (
    A2UI_SCHEMA_BLOCK_START,
    A2UI_SCHEMA_BLOCK_END,
    VERSION_0_8,
    VERSION_0_9,
)
from a2ui.basic_catalog.constants import BASIC_CATALOG_NAME


def test_catalog_id_property():
  catalog_id = "https://a2ui.org/basic_catalog.json"
  catalog = A2uiCatalog(
      version=VERSION_0_8,
      name=BASIC_CATALOG_NAME,
      s2c_schema={},
      common_types_schema={},
      catalog_schema={"catalogId": catalog_id},
  )
  assert catalog.catalog_id == catalog_id


def test_catalog_id_missing_raises_error():
  catalog = A2uiCatalog(
      version=VERSION_0_8,
      name=BASIC_CATALOG_NAME,
      s2c_schema={},
      common_types_schema={},
      catalog_schema={},  # No catalogId
  )
  with pytest.raises(
      ValueError, match=f"Catalog '{BASIC_CATALOG_NAME}' missing catalogId"
  ):
    _ = catalog.catalog_id


def test_load_examples(tmp_path):
  example_dir = tmp_path / "examples"
  example_dir.mkdir()
  (example_dir / "example1.json").write_text(
      '[{"beginRendering": {"surfaceId": "id"}}]'
  )
  (example_dir / "example2.json").write_text(
      '[{"beginRendering": {"surfaceId": "id"}}]'
  )
  (example_dir / "ignored.txt").write_text("should not be loaded")

  catalog = A2uiCatalog(
      version=VERSION_0_8,
      name=BASIC_CATALOG_NAME,
      s2c_schema={},
      common_types_schema={},
      catalog_schema={},
  )

  examples_str = catalog.load_examples(str(example_dir))
  assert "---BEGIN example1---" in examples_str
  assert '[{"beginRendering": {"surfaceId": "id"}}]' in examples_str
  assert "---BEGIN example2---" in examples_str
  assert '[{"beginRendering": {"surfaceId": "id"}}]' in examples_str
  assert "ignored" not in examples_str


def test_load_examples_validation_fails_on_bad_json(tmp_path):
  example_dir = tmp_path / "examples"
  example_dir.mkdir()
  (example_dir / "bad.json").write_text("{ this is bad json }")

  catalog = A2uiCatalog(
      version=VERSION_0_8,
      name=BASIC_CATALOG_NAME,
      s2c_schema={},
      common_types_schema={},
      catalog_schema={"catalogId": "basic"},
  )

  with pytest.raises(ValueError, match="Failed to validate example.*bad.json"):
    catalog.load_examples(str(example_dir), validate=True)


def test_load_examples_validation_fails_on_schema_error(tmp_path):
  example_dir = tmp_path / "examples"
  example_dir.mkdir()
  (example_dir / "invalid.json").write_text('{"myKey": "stringValue"}')

  # A schema that expects myKey to be an integer
  schema = {
      "type": "object",
      "properties": {"myKey": {"type": "integer"}},
      "required": ["myKey"],
  }

  catalog = A2uiCatalog(
      version=VERSION_0_8,
      name=BASIC_CATALOG_NAME,
      s2c_schema=schema,
      common_types_schema={},
      catalog_schema={"catalogId": "basic"},
  )

  with pytest.raises(ValueError, match="Failed to validate example.*invalid.json"):
    catalog.load_examples(str(example_dir), validate=True)


def test_load_examples_none_or_invalid_path():
  catalog = A2uiCatalog(
      version=VERSION_0_8,
      name=BASIC_CATALOG_NAME,
      s2c_schema={},
      common_types_schema={},
      catalog_schema={},
  )

  assert catalog.load_examples(None) == ""
  assert catalog.load_examples("/non/existent/path") == ""


def test_with_pruning_components():
  catalog_schema = {
      "catalogId": "basic",
      "components": {
          "Text": {"type": "object"},
          "Button": {"type": "object"},
          "Image": {"type": "object"},
      },
  }
  catalog = A2uiCatalog(
      version=VERSION_0_8,
      name=BASIC_CATALOG_NAME,
      s2c_schema={},
      common_types_schema={},
      catalog_schema=catalog_schema,
  )

  # Test basic pruning
  pruned_catalog = catalog.with_pruning(allowed_components=["Text", "Button"])
  pruned = pruned_catalog.catalog_schema
  assert "Text" in pruned["components"]
  assert "Button" in pruned["components"]
  assert "Image" not in pruned["components"]
  assert pruned_catalog is not catalog  # Should be a new instance

  # Test anyComponent oneOf filtering
  catalog_schema_with_defs = {
      "catalogId": "basic",
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
  catalog_with_defs = A2uiCatalog(
      version=VERSION_0_9,
      name=BASIC_CATALOG_NAME,
      s2c_schema={},
      common_types_schema={},
      catalog_schema=catalog_schema_with_defs,
  )
  pruned_catalog_defs = catalog_with_defs.with_pruning(allowed_components=["Text"])
  any_comp = pruned_catalog_defs.catalog_schema["$defs"]["anyComponent"]
  assert len(any_comp["oneOf"]) == 1
  assert any_comp["oneOf"][0]["$ref"] == "#/components/Text"

  # Test empty allowed components (should return original self)
  assert catalog.with_pruning(allowed_components=[]) is catalog


def test_with_pruning_messages():
  s2c_schema = {
      "oneOf": [
          {"$ref": "#/$defs/MessageA"},
          {"$ref": "#/$defs/MessageB"},
          {"$ref": "#/$defs/MessageC"},
      ],
      "$defs": {
          "MessageA": {"type": "object", "properties": {"a": {"type": "string"}}},
          "MessageB": {"type": "object", "properties": {"b": {"type": "string"}}},
          "MessageC": {"type": "object", "properties": {"c": {"type": "string"}}},
      },
  }
  catalog_schema = {"catalogId": "basic"}
  catalog = A2uiCatalog(
      version=VERSION_0_9,
      name=BASIC_CATALOG_NAME,
      s2c_schema=s2c_schema,
      common_types_schema={},
      catalog_schema=catalog_schema,
  )

  # Prune to only MessageA and MessageC
  pruned_catalog = catalog.with_pruning([], allowed_messages=["MessageA", "MessageC"])
  pruned_s2c = pruned_catalog.s2c_schema

  assert len(pruned_s2c["oneOf"]) == 2
  assert {"$ref": "#/$defs/MessageA"} in pruned_s2c["oneOf"]
  assert {"$ref": "#/$defs/MessageC"} in pruned_s2c["oneOf"]
  assert {"$ref": "#/$defs/MessageB"} not in pruned_s2c["oneOf"]

  assert "MessageA" in pruned_s2c["$defs"]
  assert "MessageC" in pruned_s2c["$defs"]
  assert "MessageB" not in pruned_s2c["$defs"]


def test_with_pruning_messages_internal_reachability():
  s2c_schema = {
      "oneOf": [
          {"$ref": "#/$defs/MessageA"},
      ],
      "$defs": {
          "MessageA": {
              "type": "object",
              "properties": {"shared": {"$ref": "#/$defs/SharedType"}},
          },
          "SharedType": {"type": "string"},
          "UnusedType": {"type": "number"},
      },
  }
  catalog_schema = {"catalogId": "basic"}
  catalog = A2uiCatalog(
      version=VERSION_0_9,
      name=BASIC_CATALOG_NAME,
      s2c_schema=s2c_schema,
      common_types_schema={},
      catalog_schema=catalog_schema,
  )

  # Prune to MessageA. SharedType should be kept, UnusedType should be removed.
  pruned_catalog = catalog.with_pruning([], allowed_messages=["MessageA"])
  pruned_defs = pruned_catalog.s2c_schema["$defs"]

  assert "MessageA" in pruned_defs
  assert "SharedType" in pruned_defs
  assert "UnusedType" not in pruned_defs


def test_render_as_llm_instructions():
  catalog = A2uiCatalog(
      version=VERSION_0_9,
      name=BASIC_CATALOG_NAME,
      s2c_schema={"s2c": "schema"},
      common_types_schema={"$defs": {"common": "types"}},
      catalog_schema={
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "catalog": "schema",
          "catalogId": "id_basic",
      },
  )

  schema_str = catalog.render_as_llm_instructions()
  assert A2UI_SCHEMA_BLOCK_START in schema_str
  assert '### Server To Client Schema:\n{\n  "s2c": "schema"\n}' in schema_str
  assert (
      '### Common Types Schema:\n{\n  "$defs": {\n    "common": "types"\n  }\n}'
      in schema_str
  )
  assert "### Catalog Schema:" in schema_str
  assert '"catalog": "schema"' in schema_str
  assert '"catalogId": "id_basic"' in schema_str
  assert A2UI_SCHEMA_BLOCK_END in schema_str


def test_render_as_llm_instructions_drops_empty_common_types():
  # Test with empty common_types_schema
  catalog_empty = A2uiCatalog(
      version=VERSION_0_9,
      name=BASIC_CATALOG_NAME,
      s2c_schema={"s2c": "schema"},
      common_types_schema={},
      catalog_schema={
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "catalog": "schema",
          "catalogId": "id_basic",
      },
  )
  schema_str_empty = catalog_empty.render_as_llm_instructions()
  assert "### Common Types Schema:" not in schema_str_empty

  # Test with common_types_schema missing $defs
  catalog_no_defs = A2uiCatalog(
      version=VERSION_0_9,
      name=BASIC_CATALOG_NAME,
      s2c_schema={"s2c": "schema"},
      common_types_schema={"something": "else"},
      catalog_schema={
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "catalog": "schema",
          "catalogId": "id_basic",
      },
  )
  schema_str_no_defs = catalog_no_defs.render_as_llm_instructions()
  assert "### Common Types Schema:" not in schema_str_no_defs

  # Test with common_types_schema having empty $defs
  catalog_empty_defs = A2uiCatalog(
      version=VERSION_0_9,
      name=BASIC_CATALOG_NAME,
      s2c_schema={"s2c": "schema"},
      common_types_schema={"$defs": {}},
      catalog_schema={
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "catalog": "schema",
          "catalogId": "id_basic",
      },
  )
  schema_str_empty_defs = catalog_empty_defs.render_as_llm_instructions()
  assert "### Common Types Schema:" not in schema_str_empty_defs


def test_with_pruning_common_types():
  common_types = {
      "$defs": {
          "TypeForCompA": {"type": "string"},
          "TypeForCompB": {"type": "number"},
      }
  }
  catalog_schema = {
      "catalogId": "basic",
      "components": {
          "CompA": {"$ref": "common_types.json#/$defs/TypeForCompA"},
          "CompB": {"$ref": "common_types.json#/$defs/TypeForCompB"},
      },
  }
  catalog = A2uiCatalog(
      version=VERSION_0_8,
      name=BASIC_CATALOG_NAME,
      s2c_schema={},
      common_types_schema=common_types,
      catalog_schema=catalog_schema,
  )

  pruned_catalog = catalog.with_pruning(allowed_components=["CompA"])
  pruned_defs = pruned_catalog.common_types_schema["$defs"]

  assert "TypeForCompA" in pruned_defs
  assert "TypeForCompB" not in pruned_defs


def test_with_pruning_s2c_also_prunes_common_types():
  common_types = {
      "$defs": {
          "TypeForA": {"type": "string"},
          "TypeForB": {"type": "number"},
      }
  }
  s2c_schema = {
      "oneOf": [
          {"$ref": "#/$defs/MessageA"},
          {"$ref": "#/$defs/MessageB"},
      ],
      "$defs": {
          "MessageA": {"$ref": "common_types.json#/$defs/TypeForA"},
          "MessageB": {"$ref": "common_types.json#/$defs/TypeForB"},
      },
  }
  catalog_schema = {"catalogId": "basic"}
  catalog = A2uiCatalog(
      version=VERSION_0_9,
      name=BASIC_CATALOG_NAME,
      s2c_schema=s2c_schema,
      common_types_schema=common_types,
      catalog_schema=catalog_schema,
  )

  # Prune to only MessageA
  pruned_catalog = catalog.with_pruning([], allowed_messages=["MessageA"])

  assert "MessageA" in pruned_catalog.s2c_schema["$defs"]
  assert "MessageB" not in pruned_catalog.s2c_schema["$defs"]

  assert "TypeForA" in pruned_catalog.common_types_schema["$defs"]
  assert "TypeForB" not in pruned_catalog.common_types_schema["$defs"]


def test_with_pruning_messages_v08():
  s2c_schema = {
      "properties": {
          "beginRendering": {"type": "object"},
          "surfaceUpdate": {"type": "object"},
          "deleteSurface": {"type": "object"},
      },
      "required": ["surfaceId"],
  }
  catalog_schema = {"catalogId": "basic"}
  catalog = A2uiCatalog(
      version=VERSION_0_8,
      name=BASIC_CATALOG_NAME,
      s2c_schema=s2c_schema,
      common_types_schema={},
      catalog_schema=catalog_schema,
  )

  # Prune to only beginRendering and deleteSurface
  pruned_catalog = catalog.with_pruning(
      [], allowed_messages=["beginRendering", "deleteSurface"]
  )
  pruned_s2c = pruned_catalog.s2c_schema

  assert "beginRendering" in pruned_s2c["properties"]
  assert "deleteSurface" in pruned_s2c["properties"]
  assert "surfaceUpdate" not in pruned_s2c["properties"]
  assert pruned_s2c["required"] == ["surfaceId"]
