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
from a2ui.inference.schema.manager import A2uiSchemaManager, A2uiCatalog, CustomCatalogConfig


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
                            "theme": {"type": "object", "additionalProperties": True},
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
                            "value": {"additionalProperties": True},
                        },
                        "required": ["surfaceId"],
                        "additionalProperties": False,
                    },
                },
                "required": ["version", "updateDataModel"],
                "additionalProperties": False,
            },
        },
    }
    catalog_schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://a2ui.org/specification/v0_9/standard_catalog.json",
        "title": "A2UI Standard Catalog",
        "catalogId": "https://a2ui.dev/specification/v0_9/standard_catalog.json",
        "components": {
            "Text": {
                "type": "object",
                "allOf": [
                    {"$ref": "common_types.json#/$defs/ComponentCommon"},
                    {"$ref": "#/$defs/CatalogComponentCommon"},
                    {
                        "type": "object",
                        "properties": {
                            "component": {"const": "Text"},
                            "text": {"$ref": "common_types.json#/$defs/DynamicString"},
                            "variant": {
                                "type": "string",
                                "enum": [
                                    "h1",
                                    "h2",
                                    "h3",
                                    "h4",
                                    "h5",
                                    "caption",
                                    "body",
                                ],
                            },
                        },
                        "required": ["component", "text"],
                    },
                ],
            },
            "Image": {},
            "Icon": {},
        },
        "theme": {"primaryColor": {"type": "string"}, "iconUrl": {"type": "string"}},
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
                    {"type": "array", "items": {"type": "string"}},
                    {"$ref": "#/$defs/DataBinding"},
                ]
            },
        },
    }
    return A2uiCatalog(
        version="0.9",
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
            },
            "required": ["surfaceId", "components"],
        },
    }
    catalog_schema = {
        "catalogId": (
            "https://a2ui.org/specification/v0_8/json/standard_catalog_definition.json"
        ),
        "components": {"Text": {"type": "object"}, "Button": {"type": "object"}},
        "styles": {"font": {"type": "string"}, "primaryColor": {"type": "string"}},
    }
    return A2uiCatalog(
        version="0.8",
        name="standard",
        catalog_schema=catalog_schema,
        s2c_schema=s2c_schema,
        common_types_schema=None,
    )

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
        "version": "0.9",
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
                        "explicitList": {"type": "array", "items": {"type": "string"}}
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
        version="0.8",
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
                    "id": "c1",
                    "component": {"Canvas": {"children": {"explicitList": ["item1"]}}},
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
        version="0.9",
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
                {"id": "c1", "component": "Canvas", "children": ["child1"]},
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
