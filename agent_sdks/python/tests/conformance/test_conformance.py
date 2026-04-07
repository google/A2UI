import os
import yaml
import pytest
import jsonschema
from a2ui.core.schema.catalog import A2uiCatalog
from a2ui.core.parser.streaming import A2uiStreamParser
from a2ui.core.parser.response_part import ResponsePart
from a2ui.core.schema.validator import A2uiValidator

SCHEMA_0_8 = {
    "title": "A2UI Message Schema",
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "beginRendering": {
            "type": "object",
            "properties": {
                "surfaceId": {"type": "string"},
                "root": {"type": "string"},
                "styles": {"type": "object", "additionalProperties": True},
            },
            "required": ["surfaceId", "root"],
        },
        "surfaceUpdate": {
            "type": "object",
            "properties": {
                "surfaceId": {"type": "string"},
                "components": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "string"},
                            "component": {
                                "type": "object",
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
                "contents": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "key": {"type": "string"},
                            "valueString": {"type": "string"},
                            "valueNumber": {"type": "number"},
                            "valueBoolean": {"type": "boolean"},
                            "valueMap": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "key": {"type": "string"},
                                        "valueString": {"type": "string"},
                                        "valueNumber": {"type": "number"},
                                        "valueBoolean": {"type": "boolean"},
                                    },
                                    "required": ["key"],
                                },
                            },
                        },
                        "required": ["key"],
                    },
                },
            },
            "required": ["surfaceId", "contents"],
        },
        "deleteSurface": {
            "type": "object",
            "properties": {"surfaceId": {"type": "string"}},
            "required": ["surfaceId"],
        },
    },
}

SCHEMA_0_9 = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://a2ui.org/specification/v0_9/server_to_client.json",
    "title": "A2UI Message Schema",
    "type": "object",
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
                        "surfaceId": {"type": "string"},
                        "catalogId": {"type": "string"},
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
                        "surfaceId": {"type": "string"},
                        "root": {"type": "string"},
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
                        "surfaceId": {"type": "string"},
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
                    "properties": {"surfaceId": {"type": "string"}},
                    "required": ["surfaceId"],
                },
            },
            "required": ["version", "deleteSurface"],
        },
    },
}


def get_schema(version):
  if version == "0.8":
    return SCHEMA_0_8
  elif version == "0.9":
    return SCHEMA_0_9
  else:
    raise ValueError(f"Unknown version {version}")


def load_tests(filename):
  path = os.path.abspath(
      os.path.join(os.path.dirname(__file__), "../../../conformance", filename)
  )
  with open(path, "r") as f:
    return yaml.safe_load(f)


def setup_catalog(version, catalog_data=None, catalog_ref=None):
  s2c_schema = get_schema(version)
  catalog_schema = (
      catalog_data if catalog_data else {"catalogId": "test_catalog", "components": {}}
  )

  return A2uiCatalog(
      version=version,
      name="test_catalog",
      s2c_schema=s2c_schema,
      common_types_schema={},
      catalog_schema=catalog_schema,
  )


def assert_parts_match(actual_parts, expected_parts):
  assert len(actual_parts) == len(expected_parts)
  for actual, expected in zip(actual_parts, expected_parts):
    if "text" in expected:
      assert actual.text == expected["text"]
    if "a2ui" in expected:
      assert actual.a2ui_json == expected["a2ui"]


def get_conformance_cases(filename):
  cases = load_tests(filename)
  return [(case["name"], case) for case in cases]


@pytest.mark.parametrize(
    "name, test_case", get_conformance_cases("parser.yaml"), ids=lambda x: x
)
def test_parser_conformance(name, test_case):
  constructor = test_case["constructor"]
  catalog = setup_catalog(
      constructor["version"], catalog_data=constructor.get("catalog")
  )
  parser = A2uiStreamParser(catalog=catalog)

  for step in test_case["process_chunk"]:
    if "expect_error" in step:
      with pytest.raises(ValueError, match=step["expect_error"]):
        parser.process_chunk(step["input"])
    else:
      print(f"\n--- Test: {name}")
      print(f"--- Step Input: {step['input']}")
      parts = parser.process_chunk(step["input"])
      print(f"--- Step Output: {parts}")
      print(f"--- Step Expect: {step['expect']}")
      assert_parts_match(parts, step["expect"])


@pytest.mark.parametrize(
    "name, test_case", get_conformance_cases("validator.yaml"), ids=lambda x: x
)
def test_validator_conformance(name, test_case):
  constructor = test_case["constructor"]
  catalog = setup_catalog(
      constructor["version"], catalog_data=constructor.get("catalog")
  )
  validator = A2uiValidator(catalog=catalog)

  for case in test_case["validate"]:
    if "expect_error" in case:
      with pytest.raises(ValueError, match=case["expect_error"]):
        validator.validate(case["payload"])
    else:
      validator.validate(case["payload"])
