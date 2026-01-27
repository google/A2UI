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

from a2ui.inference.schema.catalog import A2uiCatalog
from a2ui.inference.schema.constants import CATALOG_COMPONENTS_KEY, CATALOG_ID_KEY


def test_resolve_no_ref():
  custom = {
      CATALOG_COMPONENTS_KEY: {
          "CustomButton": {
              "type": "object",
              "properties": {"label": {"type": "string"}},
          }
      }
  }
  basic = {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      CATALOG_ID_KEY: "https://a2ui.org/basic_catalog.json",
      CATALOG_COMPONENTS_KEY: {
          "Text": {"type": "object", "properties": {"text": {"type": "string"}}}
      },
  }
  resolved = A2uiCatalog.resolve_schema(basic, custom)
  assert "CustomButton" in resolved[CATALOG_COMPONENTS_KEY]
  assert "Text" not in resolved[CATALOG_COMPONENTS_KEY]


def test_resolve_with_ref():
  basic = {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      CATALOG_ID_KEY: "https://a2ui.org/basic_catalog.json",
      CATALOG_COMPONENTS_KEY: {
          "Text": {"type": "object", "properties": {"text": {"type": "string"}}},
          "Image": {"type": "object"},
      },
  }
  custom = {
      CATALOG_COMPONENTS_KEY: {
          "$ref": "https://a2ui.org/basic_catalog.json#/components",
          "Canvas": {"type": "object"},
      }
  }
  resolved = A2uiCatalog.resolve_schema(basic, custom)
  assert "Canvas" in resolved[CATALOG_COMPONENTS_KEY]
  assert "Text" in resolved[CATALOG_COMPONENTS_KEY]
  assert "Image" in resolved[CATALOG_COMPONENTS_KEY]
  assert "$ref" not in resolved[CATALOG_COMPONENTS_KEY]


def test_resolve_override_without_ref():
  custom = {
      CATALOG_COMPONENTS_KEY: {
          "Text": {"type": "object", "properties": {"custom": {"type": "string"}}}
      }
  }
  basic = {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      CATALOG_ID_KEY: "https://a2ui.org/basic_catalog.json",
      CATALOG_COMPONENTS_KEY: {
          "Text": {"type": "object", "properties": {"text": {"type": "string"}}}
      },
  }
  resolved = A2uiCatalog.resolve_schema(basic, custom)
  assert "custom" in resolved[CATALOG_COMPONENTS_KEY]["Text"]["properties"]
  assert "text" not in resolved[CATALOG_COMPONENTS_KEY]["Text"]["properties"]


def test_resolve_any_component_with_ref():
  basic = {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      CATALOG_ID_KEY: "https://a2ui.org/basic_catalog.json",
      CATALOG_COMPONENTS_KEY: {
          "Text": {"type": "object", "properties": {"text": {"type": "string"}}}
      },
      "$defs": {"anyComponent": {"oneOf": [{"$ref": "#/components/Text"}]}},
  }
  custom = {
      CATALOG_COMPONENTS_KEY: {
          "CustomComp": {"type": "object", "properties": {"custom": {"type": "string"}}}
      },
      "$defs": {
          "anyComponent": {
              "oneOf": [
                  {"$ref": "#/components/CustomComp"},
                  {"$ref": "https://a2ui.org/basic_catalog.json#/$defs/anyComponent"},
              ]
          }
      },
  }
  resolved = A2uiCatalog.resolve_schema(basic, custom)
  one_of = resolved["$defs"]["anyComponent"]["oneOf"]
  assert len(one_of) == 2
  refs = {item["$ref"] for item in one_of}
  assert "#/components/CustomComp" in refs
  assert "#/components/Text" in refs
  assert "CustomComp" in resolved[CATALOG_COMPONENTS_KEY]
  assert "Text" in resolved[CATALOG_COMPONENTS_KEY]


def test_resolve_any_component_without_ref():
  basic = {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      CATALOG_ID_KEY: "https://a2ui.org/basic_catalog.json",
      CATALOG_COMPONENTS_KEY: {
          "Text": {"type": "object", "properties": {"text": {"type": "string"}}}
      },
      "$defs": {"anyComponent": {"oneOf": [{"$ref": "#/components/Text"}]}},
  }
  custom = {
      CATALOG_COMPONENTS_KEY: {
          "CustomComp": {"type": "object", "properties": {"custom": {"type": "string"}}}
      },
      "$defs": {"anyComponent": {"oneOf": [{"$ref": "#/components/CustomComp"}]}},
  }
  resolved = A2uiCatalog.resolve_schema(basic, custom)
  one_of = resolved["$defs"]["anyComponent"]["oneOf"]
  assert len(one_of) == 1
  assert one_of[0]["$ref"] == "#/components/CustomComp"
  assert "CustomComp" in resolved[CATALOG_COMPONENTS_KEY]
  assert "Text" not in resolved[CATALOG_COMPONENTS_KEY]


def test_resolve_functions_no_ref():
  custom = {"functions": {"customFunc": {"call": "customFunc"}}}
  basic = {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      CATALOG_ID_KEY: "https://a2ui.org/basic_catalog.json",
      "functions": {"required": {"call": "required"}},
  }
  resolved = A2uiCatalog.resolve_schema(basic, custom)
  assert "customFunc" in resolved["functions"]
  assert "required" not in resolved["functions"]


def test_resolve_functions_with_ref():
  basic = {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      CATALOG_ID_KEY: "https://a2ui.org/basic_catalog.json",
      "functions": {"FuncA": {"type": "object"}, "FuncB": {"type": "object"}},
  }
  custom = {
      "functions": {
          "$ref": "https://a2ui.org/basic_catalog.json#/functions",
          "FuncC": {"type": "object"},
      }
  }
  resolved = A2uiCatalog.resolve_schema(basic, custom)
  assert "FuncA" in resolved["functions"]
  assert "FuncB" in resolved["functions"]
  assert "FuncC" in resolved["functions"]
  assert "$ref" not in resolved["functions"]


def test_resolve_any_function_with_ref():
  basic = {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      CATALOG_ID_KEY: "https://a2ui.org/basic_catalog.json",
      "functions": {"FuncA": {"type": "object"}},
      "$defs": {"anyFunction": {"oneOf": [{"$ref": "#/functions/FuncA"}]}},
  }
  custom = {
      "functions": {"FuncB": {"type": "object"}},
      "$defs": {
          "anyFunction": {
              "oneOf": [
                  {"$ref": "#/functions/FuncB"},
                  {"$ref": "https://a2ui.org/basic_catalog.json#/$defs/anyFunction"},
              ]
          }
      },
  }
  resolved = A2uiCatalog.resolve_schema(basic, custom)
  one_of = resolved["$defs"]["anyFunction"]["oneOf"]
  assert len(one_of) == 2
  refs = {item["$ref"] for item in one_of}
  assert "#/functions/FuncA" in refs
  assert "#/functions/FuncB" in refs
  assert "FuncA" in resolved["functions"]
  assert "FuncB" in resolved["functions"]


def test_resolve_functions_override():
  basic = {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      CATALOG_ID_KEY: "https://a2ui.org/basic_catalog.json",
      "functions": {"FuncA": {"properties": {"a": {"type": "string"}}}},
  }
  custom = {"functions": {"FuncA": {"properties": {"b": {"type": "string"}}}}}
  resolved = A2uiCatalog.resolve_schema(basic, custom)
  assert "b" in resolved["functions"]["FuncA"]["properties"]
  assert "a" not in resolved["functions"]["FuncA"]["properties"]
