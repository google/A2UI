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
import copy
import pytest
from unittest.mock import MagicMock
from a2ui.schema.manager import A2uiSchemaManager, A2uiCatalog, CatalogConfig
from a2ui.schema.common_modifiers import remove_strict_validation
from a2ui.schema.constants import VERSION_0_8, VERSION_0_9
from a2ui.schema.validator import (
    _find_root_id as find_root_id,
    extract_component_ref_fields,
    analyze_topology,
    get_component_references,
)


class TestValidator:

  @pytest.fixture
  def catalog_0_9(self):
    s2c_schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://a2ui.org/specification/v0_9/server_to_client.json",
        "title": "A2UI Message Schema",
        "oneOf": [
            {"$ref": "#/$defs/CreateSurfaceMessage"},
            {"$ref": "#/$defs/UpdateComponentsMessage"},
            {"$ref": "#/$defs/UpdateDataModelMessage"},
            {"$ref": "#/$defs/DeleteSurfaceMessage"},
        ],
        "$defs": {
            "CreateSurfaceMessage": {
                "type": "object",
                "properties": {
                    "version": {"const": "v0.9"},
                    "createSurface": {
                        "type": "object",
                        "properties": {
                            "surfaceId": {
                                "type": "string",
                            },
                            "catalogId": {
                                "type": "string",
                            },
                            "theme": {
                                "type": "object",
                                "additionalProperties": True,
                            },
                        },
                        "required": ["surfaceId", "catalogId"],
                        "additionalProperties": False,
                    },
                },
                "required": ["version", "createSurface"],
                "additionalProperties": False,
            },
            "UpdateComponentsMessage": {
                "type": "object",
                "properties": {
                    "version": {"const": "v0.9"},
                    "updateComponents": {
                        "type": "object",
                        "properties": {
                            "surfaceId": {
                                "type": "string",
                            },
                            "components": {
                                "type": "array",
                                "minItems": 1,
                                "items": {"$ref": "catalog.json#/$defs/anyComponent"},
                            },
                        },
                        "required": ["surfaceId", "components"],
                        "additionalProperties": False,
                    },
                },
                "required": ["version", "updateComponents"],
                "additionalProperties": False,
            },
            "UpdateDataModelMessage": {
                "type": "object",
                "properties": {
                    "version": {"const": "v0.9"},
                    "updateDataModel": {
                        "type": "object",
                        "properties": {
                            "surfaceId": {
                                "type": "string",
                            },
                            "path": {"type": "string"},
                            "value": {"additionalProperties": True},
                        },
                        "required": ["surfaceId"],
                        "additionalProperties": False,
                    },
                },
                "required": ["version", "updateDataModel"],
                "additionalProperties": False,
            },
            "DeleteSurfaceMessage": {
                "type": "object",
                "properties": {
                    "version": {"const": "v0.9"},
                    "deleteSurface": {
                        "type": "object",
                        "properties": {
                            "surfaceId": {"type": "string"},
                        },
                        "required": ["surfaceId"],
                        "additionalProperties": False,
                    },
                },
                "required": ["deleteSurface", "version"],
                "additionalProperties": False,
            },
        },
    }
    catalog_schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://a2ui.org/specification/v0_9/basic_catalog.json",
        "title": "A2UI Basic Catalog",
        "catalogId": "https://a2ui.dev/specification/v0_9/basic_catalog.json",
        "components": {
            "Text": {
                "type": "object",
                "allOf": [
                    {"$ref": "common_types.json#/$defs/ComponentCommon"},
                    {"$ref": "#/$defs/CatalogComponentCommon"},
                ],
                "properties": {
                    "component": {"const": "Text"},
                    "text": {"$ref": "common_types.json#/$defs/DynamicString"},
                },
                "required": ["component", "text"],
                "unevaluatedProperties": False,
            },
            "Image": {
                "type": "object",
                "allOf": [
                    {"$ref": "common_types.json#/$defs/ComponentCommon"},
                    {"$ref": "#/$defs/CatalogComponentCommon"},
                ],
                "properties": {
                    "component": {"const": "Image"},
                    "url": {"type": "string"},
                },
                "required": ["component", "url"],
                "unevaluatedProperties": False,
            },
            "Icon": {
                "type": "object",
                "allOf": [
                    {"$ref": "common_types.json#/$defs/ComponentCommon"},
                    {"$ref": "#/$defs/CatalogComponentCommon"},
                ],
                "properties": {
                    "component": {"const": "Icon"},
                    "name": {"type": "string"},
                },
                "required": ["component", "name"],
                "unevaluatedProperties": False,
            },
            "Column": {
                "type": "object",
                "allOf": [
                    {"$ref": "common_types.json#/$defs/ComponentCommon"},
                    {"$ref": "#/$defs/CatalogComponentCommon"},
                ],
                "properties": {
                    "component": {"const": "Column"},
                    "children": {"$ref": "common_types.json#/$defs/ChildList"},
                },
                "required": ["component", "children"],
                "unevaluatedProperties": False,
            },
            "Card": {
                "type": "object",
                "allOf": [
                    {"$ref": "common_types.json#/$defs/ComponentCommon"},
                    {"$ref": "#/$defs/CatalogComponentCommon"},
                ],
                "properties": {
                    "component": {"const": "Card"},
                    "child": {"$ref": "common_types.json#/$defs/ComponentId"},
                },
                "required": ["component", "child"],
                "unevaluatedProperties": False,
            },
            "Button": {
                "type": "object",
                "allOf": [
                    {"$ref": "common_types.json#/$defs/ComponentCommon"},
                    {"$ref": "#/$defs/CatalogComponentCommon"},
                ],
                "properties": {
                    "component": {"const": "Button"},
                    "text": {"type": "string"},
                    "action": {"$ref": "common_types.json#/$defs/Action"},
                },
                "required": ["component", "text", "action"],
                "unevaluatedProperties": False,
            },
            "List": {
                "type": "object",
                "allOf": [
                    {"$ref": "common_types.json#/$defs/ComponentCommon"},
                    {"$ref": "#/$defs/CatalogComponentCommon"},
                    {
                        "type": "object",
                        "properties": {
                            "component": {"const": "List"},
                            "children": {"$ref": "common_types.json#/$defs/ChildList"},
                            "direction": {
                                "type": "string",
                                "enum": ["vertical", "horizontal"],
                            },
                        },
                        "required": ["component", "children"],
                    },
                ],
                "unevaluatedProperties": False,
            },
        },
        "$defs": {
            "CatalogComponentCommon": {
                "type": "object",
                "properties": {"weight": {"type": "number"}},
            },
            "anyComponent": {
                "oneOf": [
                    {"$ref": "#/components/Text"},
                    {"$ref": "#/components/Image"},
                    {"$ref": "#/components/Icon"},
                    {"$ref": "#/components/Column"},
                    {"$ref": "#/components/Card"},
                    {"$ref": "#/components/Button"},
                    {"$ref": "#/components/List"},
                ],
                "discriminator": {"propertyName": "component"},
            },
        },
    }
    common_types_schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://a2ui.org/specification/v0_9/common_types.json",
        "title": "A2UI Common Types",
        "$defs": {
            "ComponentId": {
                "type": "string",
            },
            "AccessibilityAttributes": {
                "type": "object",
                "properties": {
                    "label": {
                        "$ref": "#/$defs/DynamicString",
                    }
                },
            },
            "Action": {"type": "object", "additionalProperties": True},
            "ComponentCommon": {
                "type": "object",
                "properties": {"id": {"$ref": "#/$defs/ComponentId"}},
                "required": ["id"],
            },
            "DataBinding": {"type": "object"},
            "DynamicString": {
                "anyOf": [{"type": "string"}, {"$ref": "#/$defs/DataBinding"}]
            },
            "DynamicValue": {
                "anyOf": [
                    {"type": "object"},
                    {"type": "array"},
                    {"$ref": "#/$defs/DataBinding"},
                ]
            },
            "DynamicNumber": {
                "anyOf": [{"type": "number"}, {"$ref": "#/$defs/DataBinding"}]
            },
            "ChildList": {
                "oneOf": [
                    {"type": "array", "items": {"$ref": "#/$defs/ComponentId"}},
                    {
                        "type": "object",
                        "properties": {
                            "componentId": {"$ref": "#/$defs/ComponentId"},
                            "path": {"type": "string"},
                        },
                        "required": ["componentId", "path"],
                        "additionalProperties": False,
                    },
                ]
            },
        },
    }
    return A2uiCatalog(
        version=VERSION_0_9,
        name="standard",
        catalog_schema=catalog_schema,
        s2c_schema=s2c_schema,
        common_types_schema=common_types_schema,
    )

  @pytest.fixture
  def catalog_0_8(self):
    s2c_schema = {
        "title": "A2UI Message Schema",
        "description": "Describes a JSON payload for an A2UI message.",
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "beginRendering": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "surfaceId": {"type": "string"},
                    "root": {"type": "string"},
                    "styles": {
                        "type": "object",
                        "description": "Styling information for the UI.",
                        "additionalProperties": True,
                    },
                },
                "required": ["surfaceId"],
            },
            "surfaceUpdate": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "surfaceId": {
                        "type": "string",
                    },
                    "components": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "properties": {
                                "id": {
                                    "type": "string",
                                },
                                "component": {
                                    "type": "object",
                                    "description": "A wrapper object.",
                                    "additionalProperties": True,
                                },
                            },
                            "required": ["id", "component"],
                        },
                    },
                },
                "required": ["surfaceId", "components"],
            },
            "dataModelUpdate": {
                "type": "object",
                "properties": {
                    "surfaceId": {"type": "string"},
                    "contents": {"type": "object", "additionalProperties": True},
                },
            },
        },
        "additionalProperties": False,
    }
    catalog_schema = {
        "catalogId": (
            "https://a2ui.org/specification/v0_8/json/standard_catalog_definition.json"
        ),
        "components": {
            "Column": {
                "type": "object",
                "additionalProperties": True,
                "properties": {
                    "children": {"type": "array", "items": {"type": "string"}}
                },
            },
            "Card": {
                "type": "object",
                "additionalProperties": True,
                "properties": {"child": {"type": "string"}},
            },
            "Button": {
                "type": "object",
                "additionalProperties": True,
                "properties": {
                    "label": {"type": "string"},
                    "action": {
                        "type": "object",
                        "properties": {
                            "functionCall": {
                                "type": "object",
                                "properties": {
                                    "call": {"type": "string"},
                                    "args": {"type": "object"},
                                },
                            }
                        },
                    },
                },
            },
            "Text": {
                "type": "object",
                "additionalProperties": True,
                "properties": {
                    "text": {
                        "anyOf": [
                            {"type": "string"},
                            {"type": "object", "additionalProperties": True},
                        ]
                    }
                },
            },
            "List": {
                "type": "object",
                "additionalProperties": True,
            },
        },
        "styles": {"font": {"type": "string"}, "primaryColor": {"type": "string"}},
    }
    return A2uiCatalog(
        version=VERSION_0_8,
        name="standard",
        catalog_schema=catalog_schema,
        s2c_schema=s2c_schema,
        common_types_schema=None,
    )

  @pytest.fixture(params=[VERSION_0_8, VERSION_0_9])
  def test_catalog(self, request, catalog_0_8, catalog_0_9):
    """Parameterized fixture to run tests on both v0.8 and v0.9 catalogs."""
    if request.param == VERSION_0_8:
      return catalog_0_8
    return catalog_0_9

  def test_validator_0_9(self, catalog_0_9):
    # v0.9+ uses Registry and referencing, not monolithic bundling.
    # We test by validating a sample message.
    message = [{
        "version": "v0.9",
        "createSurface": {
            "surfaceId": "test-id",
            "catalogId": "standard",
            "theme": {"primaryColor": "blue", "iconUrl": "http://img"},
        },
    }]
    # Should not raise exception
    catalog_0_9.validator.validate(message)

    # Test failure: version is missing
    invalid_message = [{"createSurface": {"surfaceId": "123", "catalogId": "standard"}}]
    # Note: version is missing in the message object
    with pytest.raises(ValueError) as excinfo:
      catalog_0_9.validator.validate(invalid_message)
    assert "'version' is a required property" in str(excinfo.value)

    # Test failure: wrong version const
    invalid_message = [{
        "version": VERSION_0_8,
        "createSurface": {"surfaceId": "123", "catalogId": "standard"},
    }]
    with pytest.raises(ValueError) as excinfo:
      catalog_0_9.validator.validate(invalid_message)
    assert "'v0.9' was expected" in str(excinfo.value)

    # Test failure: surfaceId must be string
    invalid_message = [{
        "version": "v0.9",
        "createSurface": {"surfaceId": 123, "catalogId": "standard"},
    }]
    with pytest.raises(ValueError) as excinfo:
      catalog_0_9.validator.validate(invalid_message)
    assert "123 is not of type 'string'" in str(excinfo.value)

    # Test failure: catalogId is missing
    invalid_message = [{"version": "v0.9", "createSurface": {"surfaceId": "123"}}]
    with pytest.raises(ValueError) as excinfo:
      catalog_0_9.validator.validate(invalid_message)
    assert "'catalogId' is a required property" in str(excinfo.value)

  def test_pretty_error_messages(self, catalog_0_9):
    payload = [
        {
            "version": "v0.9",
            "createSurface": {
                "surfaceId": "recipe-card",
                "catalogId": "https://a2ui.org/specification/v0_9/basic_catalog.json",
            },
        },
        {
            "version": "v0.9",
            "updateComponents": {
                "surfaceId": "recipe-card",
                "components": [
                    {
                        "id": "main-column",
                        "component": "Column",
                        "children": ["recipe-image"],
                        "gap": "small",
                    },
                    {
                        "id": "recipe-image",
                        "component": "Image",
                        "url": {"path": "/image"},
                        "altText": {"path": "/title"},
                        "fit": "cover",
                    },
                    {
                        "id": "title",
                        "component": "Text",
                        "text": {"path": "/title"},
                        "usageHint": "h3",
                    },
                    {
                        "id": "rating-row",
                        "component": "Row",
                        "children": ["star-icon"],
                    },
                ],
            },
        },
        {
            "version": "v0.9",
            "updateDataModel": {
                "surfaceId": "recipe-card",
                "value": {
                    "image": (
                        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=180&fit=crop"
                    )
                },
            },
        },
        {"version": "v0.9", "deleteSurface": {}},
        {"unknownMessage": {}},
    ]

    with pytest.raises(ValueError) as excinfo:
      catalog_0_9.validator.validate(payload)

    err_text = str(excinfo.value)
    print(f"\nVALIDATOR_OUTPUT_START\n{err_text}\nVALIDATOR_OUTPUT_END")

    assert "Unknown component: Row" in err_text
    assert "'usageHint' was unexpected" in err_text
    assert "'gap' was unexpected" in err_text
    assert "'altText', 'fit' were unexpected" in err_text
    assert "'surfaceId' is a required property" in err_text
    assert "{'path': '/image'} is not of type 'string'" in err_text
    assert "Unknown message type with keys ['unknownMessage']" in err_text

  def test_validator_0_8(self, catalog_0_8):
    # v0.8 uses monolithic bundling for validation
    message = [{
        "beginRendering": {
            "surfaceId": "test-id",
            "styles": {"primaryColor": "#ff0000"},
        }
    }]
    # Should not raise exception
    catalog_0_8.validator.validate(message)

    # Test failure: surfaceId must be string
    invalid_message = [{"beginRendering": {"surfaceId": 123}}]
    with pytest.raises(ValueError) as excinfo:
      catalog_0_8.validator.validate(invalid_message)
    assert "123 is not of type 'string'" in str(excinfo.value)

    # Test failure: styles must be object
    invalid_message = [
        {"beginRendering": {"surfaceId": "id", "styles": "not-an-object"}}
    ]
    with pytest.raises(ValueError) as excinfo:
      catalog_0_8.validator.validate(invalid_message)
    assert "'not-an-object' is not of type 'object'" in str(excinfo.value)

  def test_custom_catalog_0_8(self, catalog_0_8):
    """Tests validation with a custom catalog in v0.8."""
    custom_components = {
        "Canvas": {
            "type": "object",
            "properties": {
                "children": {
                    "type": "object",
                    "properties": {
                        "explicitList": {
                            "type": "array",
                            "items": {"type": "string"},
                        }
                    },
                    "required": ["explicitList"],
                }
            },
            "required": ["children"],
        },
        "Chart": {
            "type": "object",
            "properties": {
                "type": {"type": "string", "enum": ["doughnut", "pie"]},
                "title": {
                    "type": "object",
                    "properties": {
                        "literalString": {"type": "string"},
                        "path": {"type": "string"},
                    },
                },
                "chartData": {
                    "type": "object",
                    "properties": {
                        "literalArray": {"type": "array"},
                        "path": {"type": "string"},
                    },
                },
            },
            "required": ["type", "chartData"],
        },
        "GoogleMap": {
            "type": "object",
            "properties": {
                "center": {
                    "type": "object",
                    "properties": {
                        "literalObject": {"type": "object"},
                        "path": {"type": "string"},
                    },
                },
                "zoom": {
                    "type": "object",
                    "properties": {
                        "literalNumber": {"type": "number"},
                        "path": {"type": "string"},
                    },
                },
            },
            "required": ["center", "zoom"],
        },
    }

    # Create a new catalog with these components
    catalog_schema = copy.deepcopy(catalog_0_8.catalog_schema)
    catalog_schema["components"] = custom_components

    custom_catalog = A2uiCatalog(
        version=VERSION_0_8,
        name="custom",
        catalog_schema=catalog_schema,
        s2c_schema=catalog_0_8.s2c_schema,
        common_types_schema=None,
    )

    # Valid message
    message = [{
        "surfaceUpdate": {
            "surfaceId": "id1",
            "components": [
                {
                    "id": "root",
                    "component": {
                        "Canvas": {"children": {"explicitList": ["c1", "c2"]}}
                    },
                },
                {
                    "id": "c1",
                    "component": {"Canvas": {"children": {"explicitList": []}}},
                },
                {
                    "id": "c2",
                    "component": {
                        "Chart": {"type": "pie", "chartData": {"path": "/data"}}
                    },
                },
            ],
        }
    }]
    custom_catalog.validator.validate(message)

  def test_custom_catalog_0_9(self, catalog_0_9):
    """Tests validation with a custom catalog in v0.9."""
    # Use the existing catalog_0_9 fixture but override its catalog_schema
    # to include the custom components.
    custom_components = {
        "Canvas": {
            "type": "object",
            "allOf": [
                {"$ref": "common_types.json#/$defs/ComponentCommon"},
                {"$ref": "#/$defs/CatalogComponentCommon"},
                {
                    "type": "object",
                    "properties": {
                        "component": {"const": "Canvas"},
                        "children": {"$ref": "common_types.json#/$defs/ChildList"},
                    },
                    "required": ["component", "children"],
                },
            ],
        },
        "Chart": {
            "type": "object",
            "allOf": [
                {"$ref": "common_types.json#/$defs/ComponentCommon"},
                {"$ref": "#/$defs/CatalogComponentCommon"},
                {
                    "type": "object",
                    "properties": {
                        "component": {"const": "Chart"},
                        "chartType": {"enum": ["doughnut", "pie"]},
                        "title": {"$ref": "common_types.json#/$defs/DynamicString"},
                        "chartData": {"$ref": "common_types.json#/$defs/DynamicValue"},
                    },
                    "required": ["component", "chartType", "chartData"],
                },
            ],
        },
        "GoogleMap": {
            "type": "object",
            "allOf": [
                {"$ref": "common_types.json#/$defs/ComponentCommon"},
                {"$ref": "#/$defs/CatalogComponentCommon"},
                {
                    "type": "object",
                    "properties": {
                        "component": {"const": "GoogleMap"},
                        "center": {"$ref": "common_types.json#/$defs/DynamicValue"},
                        "zoom": {"$ref": "common_types.json#/$defs/DynamicNumber"},
                        "pins": {"$ref": "common_types.json#/$defs/DynamicValue"},
                    },
                    "required": ["component", "center", "zoom"],
                },
            ],
        },
    }

    # Create a new catalog with these components
    catalog_schema = copy.deepcopy(catalog_0_9.catalog_schema)
    catalog_schema["components"] = custom_components
    # Update anyComponent to include them
    catalog_schema["$defs"]["anyComponent"]["oneOf"] = [
        {"$ref": "#/components/Canvas"},
        {"$ref": "#/components/Chart"},
        {"$ref": "#/components/GoogleMap"},
    ]

    custom_catalog = A2uiCatalog(
        version=VERSION_0_9,
        name="custom",
        catalog_schema=catalog_schema,
        s2c_schema=catalog_0_9.s2c_schema,
        common_types_schema=catalog_0_9.common_types_schema,
    )

    # Valid message
    message = [{
        "version": "v0.9",
        "updateComponents": {
            "surfaceId": "s1",
            "components": [
                {"id": "root", "component": "Canvas", "children": ["c1", "c2"]},
                {"id": "c1", "component": "Canvas", "children": []},
                {
                    "id": "c2",
                    "component": "Chart",
                    "chartType": "doughnut",
                    "chartData": {"path": "/data"},
                },
            ],
        },
    }]
    custom_catalog.validator.validate(message)

  def test_bundle_0_8(self, catalog_0_8):
    bundled = catalog_0_8.validator._bundle_0_8_schemas()

    # Verify styles injection
    styles_node = bundled["properties"]["beginRendering"]["properties"]["styles"]
    assert styles_node["additionalProperties"] is False
    assert "font" in styles_node["properties"]
    assert "primaryColor" in styles_node["properties"]

    # Verify component injection
    component_node = bundled["properties"]["surfaceUpdate"]["properties"]["components"][
        "items"
    ]["properties"]["component"]
    assert component_node["additionalProperties"] is False
    assert "Text" in component_node["properties"]
    assert "Button" in component_node["properties"]

  def make_payload(self, catalog, components=None, data_model=None):
    """Helper to create a version-appropriate message payload."""
    payload = None
    if components:
      processed_components = list(components)

      processed = []
      for comp in processed_components:
        if catalog.version == VERSION_0_8:
          if isinstance(comp.get("component"), str):
            c = copy.deepcopy(comp)
            c_id = c.pop("id")
            c_type = c.pop("component")
            processed.append({"id": c_id, "component": {c_type: c}})
          else:
            processed.append(comp)
        else:
          if isinstance(comp.get("component"), dict):
            c = copy.deepcopy(comp)
            c_id = c.pop("id")
            c_comp_dict = c.pop("component")
            c_type = list(c_comp_dict.keys())[0]
            c_props = c_comp_dict[c_type]
            new_comp = {"id": c_id, "component": c_type}
            new_comp.update(c_props)
            processed.append(new_comp)
          else:
            processed.append(comp)

      if catalog.version == VERSION_0_8:
        payload = [
            {"beginRendering": {"surfaceId": "test-surface", "root": "root"}},
            {
                "surfaceUpdate": {
                    "surfaceId": "test-surface",
                    "components": processed,
                }
            },
        ]
      else:
        payload = [
            {
                "version": "v0.9",
                "createSurface": {"surfaceId": "test-surface", "catalogId": "std"},
            },
            {
                "version": "v0.9",
                "updateComponents": {
                    "surfaceId": "test-surface",
                    "components": processed,
                },
            },
        ]

    elif data_model:
      if catalog.version == VERSION_0_8:
        payload = [
            {
                "dataModelUpdate": {
                    "surfaceId": "test-surface",
                    "contents": data_model,
                }
            }
        ]
      else:
        payload = [{
            "version": "v0.9",
            "updateDataModel": {
                "surfaceId": "test-surface",
                "value": data_model,
            },
        }]

    if payload is None:
      return []

    return payload

  def test_validate_duplicate_ids(self, test_catalog):
    components = [
        {"id": "root", "component": "Text", "text": "Root"},
        {"id": "c1", "component": "Text", "text": "Hello"},
        {"id": "c1", "component": "Text", "text": "World"},
    ]
    payload = self.make_payload(test_catalog, components=components)
    with pytest.raises(ValueError, match="Duplicate component ID: c1"):
      test_catalog.validator.validate(payload)

  def test_validate_missing_root(self, test_catalog):
    # This payload has components but none are 'root'
    # bypass make_payload as it adds root if missing
    if test_catalog.version == VERSION_0_8:
      payload = [
          {"beginRendering": {"surfaceId": "test", "root": "root"}},
          {
              "surfaceUpdate": {
                  "surfaceId": "test",
                  "components": [{"id": "c1", "component": {"Text": {"text": "hi"}}}],
              }
          },
      ]
    else:
      payload = [
          {
              "version": "v0.9",
              "createSurface": {"surfaceId": "test", "catalogId": "std"},
          },
          {
              "version": "v0.9",
              "updateComponents": {
                  "surfaceId": "test",
                  "components": [{"id": "c1", "component": "Text", "text": "hi"}],
              },
          },
      ]

    with pytest.raises(ValueError, match="Missing root component"):
      test_catalog.validator.validate(payload)

  @pytest.mark.parametrize(
      "component_type, field_name, ids_to_ref",
      [
          ("Column", "children", ["missing"]),
          ("Card", "child", "missing"),
      ],
  )
  def test_validate_dangling_references(
      self, test_catalog, component_type, field_name, ids_to_ref
  ):
    components = [
        {"id": "root", "component": component_type, field_name: ids_to_ref},
    ]
    payload = self.make_payload(test_catalog, components=components)
    with pytest.raises(ValueError, match="references non-existent component"):
      test_catalog.validator.validate(payload)

  def test_validate_self_reference(self, test_catalog):
    components = [{"id": "root", "component": "Card", "child": "root"}]
    payload = self.make_payload(test_catalog, components=components)
    with pytest.raises(ValueError, match="Self-reference detected"):
      test_catalog.validator.validate(payload)

  def test_validate_circular_reference(self, test_catalog):
    components = [
        {"id": "root", "component": "Card", "child": "c1"},
        {"id": "c1", "component": "Card", "child": "root"},
    ]
    payload = self.make_payload(test_catalog, components=components)
    with pytest.raises(ValueError, match="Circular reference detected"):
      test_catalog.validator.validate(payload)

  def test_validate_function_call_recursion(self, test_catalog):
    deep_fc = {"call": "f0", "args": {}}
    current = deep_fc["args"]
    for i in range(10):
      current["functionCall"] = {"call": f"f{i+1}", "args": {}}
      current = current["functionCall"]["args"]

    components = [{
        "id": "root",
        "component": "Button",
        "text": "btn",
        "action": {"functionCall": deep_fc},
    }]
    # Button in StandardCatalog v0.9 requires 'text' and 'action'
    payload = self.make_payload(test_catalog, components=components)
    with pytest.raises(
        ValueError, match="Recursion limit exceeded: functionCall depth > 5"
    ):
      test_catalog.validator.validate(payload)

  def test_validate_orphaned_component(self, test_catalog):
    components = [
        {"id": "root", "component": "Text", "text": "Root"},
        {"id": "orphan", "component": "Text", "text": "Orphan"},
    ]
    payload = self.make_payload(test_catalog, components=components)
    with pytest.raises(
        ValueError, match="Component 'orphan' is not reachable from 'root'"
    ):
      test_catalog.validator.validate(payload)

  def test_validate_recursion_limit_exceeded(self, test_catalog):
    components = [{"id": "root", "component": "Card", "child": "c0"}]
    for i in range(55):
      components.append({"id": f"c{i}", "component": "Card", "child": f"c{i+1}"})
    components.append({"id": f"c{55}", "component": "Text", "text": "End"})

    payload = self.make_payload(test_catalog, components=components)
    with pytest.raises(
        ValueError, match="Global recursion limit exceeded: logical depth"
    ):
      test_catalog.validator.validate(payload)

  def test_validate_recursion_limit_valid(self, test_catalog):
    components = [{"id": "root", "component": "Card", "child": "c0"}]
    for i in range(40):
      components.append({"id": f"c{i}", "component": "Card", "child": f"c{i+1}"})
    components.append({"id": f"c{40}", "component": "Text", "text": "End"})

    payload = self.make_payload(test_catalog, components=components)
    test_catalog.validator.validate(payload)

  def test_validate_template_reachability(self, test_catalog):
    # Verify that componentId inside a template is reachable
    if test_catalog.version == VERSION_0_8:
      # v0.8 mock Column expects an array of strings
      comp_type = "Column"
      children = ["template-id"]
    else:
      # v0.9 mock List expects an object with componentId and path
      comp_type = "List"
      children = {"componentId": "template-id", "path": "/items"}

    components = [
        {
            "id": "root",
            "component": comp_type,
            "children": children,
        },
        {"id": "template-id", "component": "Text", "text": "Reachable"},
    ]
    payload = self.make_payload(test_catalog, components=components)
    test_catalog.validator.validate(payload)

    # Verify that if the reference points to an invalid ID, it fails
    if test_catalog.version == VERSION_0_8:
      children_invalid = ["missing-id"]
    else:
      children_invalid = {"componentId": "missing-id", "path": "/items"}

    components_invalid = [
        {
            "id": "root",
            "component": comp_type,
            "children": children_invalid,
        },
        {"id": "template-id", "component": "Text", "text": "Reachable"},
    ]
    payload_invalid = self.make_payload(test_catalog, components=components_invalid)
    with pytest.raises(
        ValueError, match="references non-existent component 'missing-id'"
    ):
      test_catalog.validator.validate(payload_invalid)

  def test_validate_v08_custom_root_reachability(self, test_catalog):
    if test_catalog.version != VERSION_0_8:
      pytest.skip("v0.8 specific test")

    # In v0.8, the root is determined by beginRendering.root
    components = [
        {"id": "custom-root", "component": "Text", "text": "I am the root"},
        {"id": "orphan", "component": "Text", "text": "I am an orphan"},
    ]
    # make_payload gives us both beginRendering and surfaceUpdate. We just need to change root.
    payload = self.make_payload(test_catalog, components=components)
    payload[0]["beginRendering"]["root"] = "custom-root"

    # This should fail because 'orphan' is not reachable from 'custom-root'
    with pytest.raises(
        ValueError, match="Component 'orphan' is not reachable from 'custom-root'"
    ):
      test_catalog.validator.validate(payload)

    # Adding a reference to 'orphan' should make it pass
    components_connected = [
        {"id": "custom-root", "component": "Card", "child": "orphan"},
        {"id": "orphan", "component": "Text", "text": "I am no longer an orphan"},
    ]
    payload_connected = self.make_payload(test_catalog, components=components_connected)
    payload_connected[0]["beginRendering"]["root"] = "custom-root"
    test_catalog.validator.validate(payload_connected)

  @pytest.mark.parametrize(
      "payload",
      [
          {
              "updateDataModel": {
                  "surfaceId": "surface1",
                  "path": "/invalid/escape/~2",
                  "value": {"some": "data"},
              }
          },
      ],
  )
  def test_validate_invalid_paths(self, test_catalog, payload):

    # Use make_payload to ensure correct wrapping and 'version' field for v0.9
    if "updateComponents" in payload:
      p = self.make_payload(
          test_catalog, components=payload["updateComponents"]["components"]
      )
    elif "updateDataModel" in payload:
      # Inject surfaceId if missing to satisfy make_payload/schema
      data = payload["updateDataModel"]
      p = self.make_payload(test_catalog, data_model=data.get("value", {}))
      # Override with test specific path
      if test_catalog.version == VERSION_0_9:
        p[0]["updateDataModel"]["path"] = data.get("path")
        p[0]["updateDataModel"]["surfaceId"] = data.get("surfaceId", "surface1")
      else:
        p[0]["dataModelUpdate"]["path"] = data.get("path")
        p[0]["dataModelUpdate"]["surfaceId"] = data.get("surfaceId", "surface1")

    with pytest.raises(
        ValueError,
        match="(Invalid path syntax|is not valid under any of the given schemas)",
    ):
      test_catalog.validator.validate(p)

  def test_validate_relative_paths(self, test_catalog):
    """Tests that relative paths are allowed."""
    components = [
        {"id": "root", "component": "Text", "text": {"path": "relative/path"}}
    ]
    payload = self.make_payload(test_catalog, components=components)
    test_catalog.validator.validate(payload)

  def test_validate_global_recursion_limit_exceeded(self, test_catalog):
    deep_data = {"level": 0}
    current = deep_data
    for i in range(55):
      current["next"] = {"level": i + 1}
      current = current["next"]

    # Generic payload that results in deep dict
    payload = self.make_payload(test_catalog, data_model=deep_data)
    with pytest.raises(ValueError, match="Global recursion limit exceeded"):
      test_catalog.validator.validate(payload)

  def test_find_root_id_v08(self):
    messages = [
        {"beginRendering": {"surfaceId": "s1", "root": "custom-root"}},
        {"surfaceUpdate": {"surfaceId": "s1", "components": []}},
    ]
    assert find_root_id(messages) == "custom-root"

  def test_find_root_id_v09(self):
    # For v0.9, if createSurface is provided, the root is 'root'
    messages = [
        {"createSurface": {"surfaceId": "s1"}},
        {"updateComponents": {"surfaceId": "s1", "components": []}},
    ]
    assert find_root_id(messages) == "root"

    # For an incremental update, there is no root
    messages = [{"updateComponents": {"surfaceId": "s1", "components": []}}]
    assert find_root_id(messages) is None

  def test_get_component_references(self):
    # Mock ref_fields_map
    ref_fields_map = {
        "Container": ({"child"}, {"children"}),
        "Text": (set(), set()),
    }
    comp = {
        "id": "c1",
        "component": "Container",
        "child": "c2",
        "children": ["c3", "c4"],
    }
    refs = list(get_component_references(comp, ref_fields_map))
    assert ("c2", "child") in refs
    assert ("c3", "children") in refs
    assert ("c4", "children") in refs

  def test_analyze_topology_circular(self):
    ref_fields_map = {"Node": ({"next"}, set())}
    components = [
        {"id": "c1", "component": "Node", "next": "c2"},
        {"id": "c2", "component": "Node", "next": "c1"},
    ]
    with pytest.raises(ValueError, match="Circular reference detected"):
      analyze_topology("c1", components, ref_fields_map)

  def test_analyze_topology_self_ref(self):
    ref_fields_map = {"Node": ({"next"}, set())}
    components = [{"id": "c1", "component": "Node", "next": "c1"}]
    with pytest.raises(ValueError, match="Self-reference detected"):
      analyze_topology("c1", components, ref_fields_map)

  def test_analyze_topology_reachable(self):
    ref_fields_map = {"Node": ({"next"}, set())}
    components = [
        {"id": "root", "component": "Node", "next": "c1"},
        {"id": "c1", "component": "Node", "next": "c2"},
        {"id": "c2", "component": "Node"},
        {"id": "orphan", "component": "Node"},
    ]
    reachable = analyze_topology("root", components, ref_fields_map)
    assert reachable == {"root", "c1", "c2"}

  def test_extract_component_ref_fields_mock(self):
    # Test with a mock catalog
    catalog = MagicMock(spec=A2uiCatalog)
    catalog.version = VERSION_0_9
    catalog.common_types_schema = {
        "$defs": {
            "ComponentId": {"type": "string"},
            "ChildList": {
                "oneOf": [
                    {"type": "array", "items": {"$ref": "#/$defs/ComponentId"}},
                    {
                        "type": "object",
                        "properties": {"componentId": {"$ref": "#/$defs/ComponentId"}},
                    },
                ]
            },
        }
    }
    catalog.catalog_schema = {
        "components": {
            "MyComp": {
                "properties": {
                    "ref": {"$ref": "common_types.json#/$defs/ComponentId"},
                    "multi": {"$ref": "common_types.json#/$defs/ChildList"},
                }
            }
        }
    }
    # Mock s2c_schema to avoid errors in extraction
    catalog.s2c_schema = {}

    ref_map = extract_component_ref_fields(catalog)
    assert "MyComp" in ref_map
    single_refs, list_refs = ref_map["MyComp"]
    assert "ref" in single_refs
    assert "multi" in list_refs

  # --- Multi-surface tests ---

  def test_validate_multi_surface_v08(self, catalog_0_8):
    """Tests that multiple surfaces with different root IDs validate correctly."""
    payload = [
        {"beginRendering": {"surfaceId": "surface-a", "root": "root-a"}},
        {"beginRendering": {"surfaceId": "surface-b", "root": "root-b"}},
        {
            "surfaceUpdate": {
                "surfaceId": "surface-a",
                "components": [
                    {"id": "root-a", "component": {"Card": {"child": "child-a"}}},
                    {"id": "child-a", "component": {"Text": {"text": "Hello A"}}},
                ],
            }
        },
        {
            "surfaceUpdate": {
                "surfaceId": "surface-b",
                "components": [
                    {"id": "root-b", "component": {"Card": {"child": "child-b"}}},
                    {"id": "child-b", "component": {"Text": {"text": "Hello B"}}},
                ],
            }
        },
    ]
    # Should not raise - each surface has its own root
    catalog_0_8.validator.validate(payload)

  def test_validate_multi_surface_missing_root_v08(self, catalog_0_8):
    """Tests that missing root in one surface still fails validation."""
    payload = [
        {"beginRendering": {"surfaceId": "surface-a", "root": "root-a"}},
        {"beginRendering": {"surfaceId": "surface-b", "root": "root-b"}},
        {
            "surfaceUpdate": {
                "surfaceId": "surface-a",
                "components": [
                    {"id": "root-a", "component": {"Text": {"text": "Hello A"}}},
                ],
            }
        },
        {
            "surfaceUpdate": {
                "surfaceId": "surface-b",
                "components": [
                    # Missing root-b, only has a non-root component
                    {"id": "not-root-b", "component": {"Text": {"text": "Hello B"}}},
                ],
            }
        },
    ]
    with pytest.raises(ValueError, match="Missing root component.*root-b"):
      catalog_0_8.validator.validate(payload)

  # --- Incremental update tests ---

  def test_incremental_update_no_root_v08(self, catalog_0_8):
    """Incremental update without root component should pass."""
    payload = [
        {
            "surfaceUpdate": {
                "surfaceId": "contact-card",
                "components": [
                    {"id": "main_card", "component": {"Card": {"child": "col"}}},
                    {"id": "col", "component": {"Text": {"text": "Updated"}}},
                ],
            }
        },
    ]
    # No beginRendering → incremental update → root check skipped
    catalog_0_8.validator.validate(payload)

  def test_incremental_update_no_root_v09(self, catalog_0_9):
    """Incremental update without root component should pass (v0.9)."""
    payload = [
        {
            "version": "v0.9",
            "updateComponents": {
                "surfaceId": "contact-card",
                "components": [
                    {"id": "card1", "component": "Card", "child": "text1"},
                    {"id": "text1", "component": "Text", "text": "Updated"},
                ],
            },
        },
    ]
    # No createSurface → incremental update → root check skipped
    catalog_0_9.validator.validate(payload)

  def test_incremental_update_orphans_allowed_v08(self, catalog_0_8):
    """Incremental update with 'orphaned' components should pass."""
    payload = [
        {
            "surfaceUpdate": {
                "surfaceId": "contact-card",
                "components": [
                    {"id": "text1", "component": {"Text": {"text": "Hello"}}},
                    {"id": "text2", "component": {"Text": {"text": "World"}}},
                ],
            }
        },
    ]
    # These are disconnected but it's an incremental update
    catalog_0_8.validator.validate(payload)

  def test_incremental_update_self_ref_still_fails(self, test_catalog):
    """Self-references should still be caught in incremental updates."""
    if test_catalog.version == VERSION_0_8:
      payload = [
          {
              "surfaceUpdate": {
                  "surfaceId": "s1",
                  "components": [
                      {"id": "card1", "component": {"Card": {"child": "card1"}}},
                  ],
              }
          },
      ]
    else:
      payload = [
          {
              "version": "v0.9",
              "updateComponents": {
                  "surfaceId": "s1",
                  "components": [
                      {"id": "card1", "component": "Card", "child": "card1"},
                  ],
              },
          },
      ]
    with pytest.raises(ValueError, match="Self-reference detected"):
      test_catalog.validator.validate(payload)

  def test_incremental_update_cycle_still_fails(self, test_catalog):
    """Cycles should still be caught in incremental updates."""
    if test_catalog.version == VERSION_0_8:
      payload = [
          {
              "surfaceUpdate": {
                  "surfaceId": "s1",
                  "components": [
                      {"id": "a", "component": {"Card": {"child": "b"}}},
                      {"id": "b", "component": {"Card": {"child": "a"}}},
                  ],
              }
          },
      ]
    else:
      payload = [
          {
              "version": "v0.9",
              "updateComponents": {
                  "surfaceId": "s1",
                  "components": [
                      {"id": "a", "component": "Card", "child": "b"},
                      {"id": "b", "component": "Card", "child": "a"},
                  ],
              },
          },
      ]
    with pytest.raises(ValueError, match="Circular reference detected"):
      test_catalog.validator.validate(payload)

  def test_incremental_update_duplicates_still_fail(self, test_catalog):
    """Duplicate IDs should still be caught in incremental updates."""
    if test_catalog.version == VERSION_0_8:
      payload = [
          {
              "surfaceUpdate": {
                  "surfaceId": "s1",
                  "components": [
                      {"id": "text1", "component": {"Text": {"text": "A"}}},
                      {"id": "text1", "component": {"Text": {"text": "B"}}},
                  ],
              }
          },
      ]
    else:
      payload = [
          {
              "version": "v0.9",
              "updateComponents": {
                  "surfaceId": "s1",
                  "components": [
                      {"id": "text1", "component": "Text", "text": "A"},
                      {"id": "text1", "component": "Text", "text": "B"},
                  ],
              },
          },
      ]
    with pytest.raises(ValueError, match="Duplicate component ID"):
      test_catalog.validator.validate(payload)
