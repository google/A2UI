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
import pytest
from unittest.mock import MagicMock
from a2ui.inference.schema.manager import A2uiSchemaManager


class TestSchemaBundling:

  @pytest.fixture
  def manager_0_9(self):
    m = A2uiSchemaManager("0.9")
    m.server_to_client_schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "A2UI Message Schema",
        "oneOf": [
            {"$ref": "#/$defs/CreateSurfaceMessage"},
            {"$ref": "#/$defs/UpdateComponentsMessage"},
        ],
        "$defs": {
            "CreateSurfaceMessage": {
                "type": "object",
                "properties": {
                    "createSurface": {
                        "type": "object",
                        "properties": {
                            "surfaceId": {
                                "type": "string",
                            },
                            "theme": {"type": "object", "additionalProperties": True},
                        },
                        "required": ["surfaceId"],
                        "additionalProperties": False,
                    }
                },
                "required": ["createSurface"],
                "additionalProperties": False,
            },
            "UpdateComponentsMessage": {
                "type": "object",
                "properties": {
                    "updateComponents": {
                        "type": "object",
                        "properties": {
                            "surfaceId": {
                                "type": "string",
                            },
                            "components": {
                                "type": "array",
                                "minItems": 1,
                                "items": {
                                    "$ref": "standard_catalog.json#/$defs/anyComponent"
                                },
                            },
                        },
                        "required": ["surfaceId", "components"],
                        "additionalProperties": False,
                    }
                },
                "required": ["updateComponents"],
                "additionalProperties": False,
            },
            "UpdateDataModelMessage": {
                "type": "object",
                "properties": {
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
                    }
                },
                "required": ["updateDataModel"],
                "additionalProperties": False,
            },
        },
    }
    m.catalog_schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
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
    m.common_types_schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
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
                "oneOf": [{"type": "string"}, {"$ref": "#/$defs/DataBinding"}]
            },
        },
    }
    return m

  @pytest.fixture
  def manager_0_8(self):
    m = A2uiSchemaManager("0.8")
    m.server_to_client_schema = {
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
    m.catalog_schema = {
        "components": {"Text": {"type": "object"}, "Button": {"type": "object"}},
        "styles": {"font": {"type": "string"}, "primaryColor": {"type": "string"}},
    }
    return m

  def test_bundle_0_9(self, manager_0_9):
    bundled_wrapped = manager_0_9.bundle_schemas()
    bundled = bundled_wrapped["items"]

    assert bundled["$schema"] == "https://json-schema.org/draft/2020-12/schema"
    assert bundled["title"] == "Bundled A2UI Message Schema"
    assert (
        bundled["description"]
        == "A self-contained bundled schema including server messages, catalog"
        " components, and common types."
    )
    assert (
        bundled["$id"]
        == "https://a2ui.dev/specification/0.9/server_to_client_bundled.json"
    )

    assert "components" in bundled
    assert "Text" in bundled["components"]

    # Verify dynamic cleanup: theme should be removed from root as it was injected
    assert "theme" not in bundled

    # Verify definitions are merged
    assert "CreateSurfaceMessage" in bundled["$defs"]
    assert "UpdateComponentsMessage" in bundled["$defs"]
    assert "CatalogComponentCommon" in bundled["$defs"]
    assert "DynamicString" in bundled["$defs"]
    assert "DataBinding" in bundled["$defs"]
    assert "ComponentId" in bundled["$defs"]
    assert "AccessibilityAttributes" in bundled["$defs"]
    assert "ComponentCommon" in bundled["$defs"]

    # Check injection in CreateSurfaceMessage -> theme
    create_surface = bundled["$defs"]["CreateSurfaceMessage"]["properties"][
        "createSurface"
    ]
    theme_node = create_surface["properties"]["theme"]
    assert theme_node["additionalProperties"] is False
    assert "primaryColor" in theme_node["properties"]
    assert "iconUrl" in theme_node["properties"]

    # Check injection in UpdateDataModelMessage -> updateDataModel -> value
    update_data_model = bundled["$defs"]["UpdateDataModelMessage"]["properties"][
        "updateDataModel"
    ]
    value_node = update_data_model["properties"]["value"]
    assert value_node["additionalProperties"] is True

  def test_bundle_0_8(self, manager_0_8):
    bundled_wrapped = manager_0_8.bundle_schemas()
    bundled = bundled_wrapped["items"]

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

  def test_bundle_external_file_stripping(self):
    m = A2uiSchemaManager("0.9")
    m.server_to_client_schema = {
        "$defs": {"A": {"$ref": "other.json#/$defs/B"}, "X": {"$ref": "other.json"}}
    }
    m.catalog_schema = {}
    m.common_types_schema = {}

    bundled_wrapped = m.bundle_schemas()
    bundled = bundled_wrapped["items"]
    assert bundled["$defs"]["A"]["$ref"] == "#/$defs/B"
    assert bundled["$defs"]["X"]["$ref"] == "#"
