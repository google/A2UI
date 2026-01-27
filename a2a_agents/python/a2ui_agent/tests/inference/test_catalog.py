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
from a2ui.inference.schema.catalog import A2uiCatalog
from a2ui.inference.schema.constants import BASIC_CATALOG_NAME


def test_catalog_id_property():
  catalog_id = "https://a2ui.org/basic_catalog.json"
  catalog = A2uiCatalog(
      version="0.8",
      name=BASIC_CATALOG_NAME,
      s2c_schema={},
      common_types_schema={},
      catalog_schema={"catalogId": catalog_id},
  )
  assert catalog.catalog_id == catalog_id


def test_catalog_id_missing_raises_error():
  catalog = A2uiCatalog(
      version="0.8",
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
  (example_dir / "example1.json").write_text('{"foo": "bar"}')
  (example_dir / "example2.json").write_text('{"baz": "qux"}')
  (example_dir / "ignored.txt").write_text("should not be loaded")

  catalog = A2uiCatalog(
      version="0.8",
      name=BASIC_CATALOG_NAME,
      s2c_schema={},
      common_types_schema={},
      catalog_schema={},
  )

  examples_str = catalog.load_examples(str(example_dir))
  assert "---BEGIN example1---" in examples_str
  assert '{"foo": "bar"}' in examples_str
  assert "---BEGIN example2---" in examples_str
  assert '{"baz": "qux"}' in examples_str
  assert "ignored" not in examples_str


def test_load_examples_none_or_invalid_path():
  catalog = A2uiCatalog(
      version="0.8",
      name=BASIC_CATALOG_NAME,
      s2c_schema={},
      common_types_schema={},
      catalog_schema={},
  )

  assert catalog.load_examples(None) == ""
  assert catalog.load_examples("/non/existent/path") == ""


def test_with_pruned_components():
  catalog_schema = {
      "catalogId": "basic",
      "components": {
          "Text": {"type": "object"},
          "Button": {"type": "object"},
          "Image": {"type": "object"},
      },
  }
  catalog = A2uiCatalog(
      version="0.8",
      name=BASIC_CATALOG_NAME,
      s2c_schema={},
      common_types_schema={},
      catalog_schema=catalog_schema,
  )

  # Test basic pruning
  pruned_catalog = catalog.with_pruned_components(["Text", "Button"])
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
      version="0.9",
      name=BASIC_CATALOG_NAME,
      s2c_schema={},
      common_types_schema={},
      catalog_schema=catalog_schema_with_defs,
  )
  pruned_catalog_defs = catalog_with_defs.with_pruned_components(["Text"])
  any_comp = pruned_catalog_defs.catalog_schema["$defs"]["anyComponent"]
  assert len(any_comp["oneOf"]) == 1
  assert any_comp["oneOf"][0]["$ref"] == "#/components/Text"

  # Test empty allowed components (should return original self)
  assert catalog.with_pruned_components([]) is catalog


def test_render_as_llm_instructions():
  catalog = A2uiCatalog(
      version="0.9",
      name=BASIC_CATALOG_NAME,
      s2c_schema={"s2c": "schema"},
      common_types_schema={"common": "types"},
      catalog_schema={
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "catalog": "schema",
          "catalogId": "id_basic",
      },
  )

  schema_str = catalog.render_as_llm_instructions()
  assert "---BEGIN A2UI JSON SCHEMA---" in schema_str
  assert '### Server To Client Schema:\n{\n  "s2c": "schema"\n}' in schema_str
  assert '### Common Types Schema:\n{\n  "common": "types"\n}' in schema_str
  assert "### Catalog Schema:" in schema_str
  assert '"catalog": "schema"' in schema_str
  assert '"catalogId": "id_basic"' in schema_str
  assert "---END A2UI JSON SCHEMA---" in schema_str
