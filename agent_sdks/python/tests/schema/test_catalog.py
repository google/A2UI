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
from a2ui.schema.catalog import A2uiCatalog
from a2ui.schema.constants import (
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


def test_resolve_examples_path_handling():
  from a2ui.schema.catalog import resolve_examples_path

  assert resolve_examples_path(None) is None
  assert resolve_examples_path("/absolute/examples") == "/absolute/examples"
  assert resolve_examples_path("file:///absolute/examples") == "/absolute/examples"

  with pytest.raises(ValueError, match="Unsupported examples URL scheme"):
    resolve_examples_path("https://a2ui.org/examples")


def test_catalog_config_from_path_schemes():
  from a2ui.schema.catalog import CatalogConfig
  # Test local path
  config = CatalogConfig.from_path(
      name="test_file", catalog_path="relative_path/to/catalog.json"
  )
  assert config.provider.path == "relative_path/to/catalog.json"

  # Test file:// scheme
  config = CatalogConfig.from_path(
      name="test_file", catalog_path="file:///absolute_path/to/catalog.json"
  )
  assert config.provider.path == "/absolute_path/to/catalog.json"

  # Test HTTP raises NotImplementedError
  with pytest.raises(NotImplementedError, match="HTTP support is coming soon."):
    CatalogConfig.from_path(
        name="test_http", catalog_path="http://a2ui.org/catalog.json"
    )

  # Test unsupported scheme raises ValueError
  with pytest.raises(ValueError, match="Unsupported catalog URL scheme"):
    CatalogConfig.from_path(name="test_ftp", catalog_path="ftp://a2ui.org/catalog.json")


def test_basic_catalog_get_config_examples_path():
  from a2ui.basic_catalog.provider import BasicCatalog
  from a2ui.schema.constants import VERSION_0_9

  # Test get_config with file:// scheme examples path
  config = BasicCatalog.get_config(
      version=VERSION_0_9, examples_path="file:///absolute/examples"
  )
  assert config.examples_path == "/absolute/examples"


def test_load_examples_with_glob(tmp_path):
  example_dir = tmp_path / "examples"
  example_dir.mkdir()

  sub_dir = example_dir / "nested"
  sub_dir.mkdir()

  (example_dir / "top.json").write_text('[{"beginRendering": {"surfaceId": "top"}}]')
  (sub_dir / "deep.json").write_text('[{"beginRendering": {"surfaceId": "deep"}}]')
  (example_dir / "ignored.txt").write_text("not json")

  catalog = A2uiCatalog(
      version=VERSION_0_8,
      name=BASIC_CATALOG_NAME,
      s2c_schema={},
      common_types_schema={},
      catalog_schema={},
  )

  # Match only top-level using a specific glob
  examples_top = catalog.load_examples(str(example_dir / "*.json"))
  assert "---BEGIN top---" in examples_top
  assert "---BEGIN deep---" not in examples_top

  # Match recursively using globstar
  examples_all = catalog.load_examples(str(example_dir / "**" / "*.json"))
  assert "---BEGIN top---" in examples_all
  assert "---BEGIN deep---" in examples_all


def test_load_examples_with_glob_prefix_suffix(tmp_path):
  example_dir = tmp_path / "examples"
  example_dir.mkdir()

  (example_dir / "user_profile.json").write_text(
      '[{"beginRendering": {"surfaceId": "user"}}]'
  )
  (example_dir / "user_settings.json").write_text(
      '[{"beginRendering": {"surfaceId": "settings"}}]'
  )
  (example_dir / "admin_profile.json").write_text(
      '[{"beginRendering": {"surfaceId": "admin"}}]'
  )

  catalog = A2uiCatalog(
      version=VERSION_0_8,
      name=BASIC_CATALOG_NAME,
      s2c_schema={},
      common_types_schema={},
      catalog_schema={},
  )

  # Filter by prefix: user_*.json
  user_examples = catalog.load_examples(str(example_dir / "user_*.json"))
  assert "---BEGIN user_profile---" in user_examples
  assert "---BEGIN user_settings---" in user_examples
  assert "---BEGIN admin_profile---" not in user_examples

  # Filter by suffix: *_profile.json
  profile_examples = catalog.load_examples(str(example_dir / "*_profile.json"))
  assert "---BEGIN user_profile---" in profile_examples
  assert "---BEGIN admin_profile---" in profile_examples
  assert "---BEGIN user_settings---" not in profile_examples


def test_load_examples_with_glob_advanced_cases(tmp_path):
  example_dir = tmp_path / "examples"
  example_dir.mkdir()

  # 1. Create standard files for character range matching
  (example_dir / "step1.json").write_text('[{"beginRendering": {"surfaceId": "1"}}]')
  (example_dir / "step2.json").write_text('[{"beginRendering": {"surfaceId": "2"}}]')
  (example_dir / "step3.json").write_text('[{"beginRendering": {"surfaceId": "3"}}]')

  # 2. Create a directory that ends in .json
  fake_json_dir = example_dir / "directory.json"
  fake_json_dir.mkdir()

  catalog = A2uiCatalog(
      version=VERSION_0_8,
      name=BASIC_CATALOG_NAME,
      s2c_schema={},
      common_types_schema={},
      catalog_schema={},
  )

  # Test character range matching
  range_examples = catalog.load_examples(str(example_dir / "step[1-2].json"))
  assert "---BEGIN step1---" in range_examples
  assert "---BEGIN step2---" in range_examples
  assert "---BEGIN step3---" not in range_examples

  # Test that directory matching *.json is skipped correctly
  all_examples = catalog.load_examples(str(example_dir / "*.json"))
  assert "---BEGIN step1---" in all_examples
  assert "directory" not in all_examples

  # Test zero matches returns empty string
  assert catalog.load_examples(str(example_dir / "*.yaml")) == ""


def test_load_examples_with_glob_negation(tmp_path):
  example_dir = tmp_path / "examples"
  example_dir.mkdir()

  (example_dir / "visible.json").write_text(
      '[{"beginRendering": {"surfaceId": "visible"}}]'
  )
  (example_dir / "index.json").write_text(
      '[{"beginRendering": {"surfaceId": "index"}}]'
  )

  catalog = A2uiCatalog(
      version=VERSION_0_8,
      name=BASIC_CATALOG_NAME,
      s2c_schema={},
      common_types_schema={},
      catalog_schema={},
  )

  # Test negation to exclude files starting with 'i' (like index.json)
  negation_examples = catalog.load_examples(str(example_dir / "[!i]*.json"))
  assert "---BEGIN visible---" in negation_examples
  assert "---BEGIN index---" not in negation_examples
