import os
import yaml
import pytest
import jsonschema
from a2ui.core.schema.catalog import A2uiCatalog
from a2ui.core.parser.streaming import A2uiStreamParser
from a2ui.core.parser.response_part import ResponsePart
from a2ui.core.schema.validator import A2uiValidator

import json


def load_json_file(filename):
  path = os.path.abspath(
      os.path.join(os.path.dirname(__file__), "../../../conformance", filename)
  )
  with open(path, "r") as f:
    return json.load(f)


def load_tests(filename):
  path = os.path.abspath(
      os.path.join(os.path.dirname(__file__), "../../../conformance", filename)
  )
  with open(path, "r") as f:
    return yaml.safe_load(f)


def setup_catalog(catalog_config):
  version = catalog_config["version"]

  s2c_schema = catalog_config.get("s2c_schema")
  if isinstance(s2c_schema, str):
    s2c_schema = load_json_file(s2c_schema)

  catalog_schema = catalog_config.get("catalog_schema")
  if isinstance(catalog_schema, str):
    catalog_schema = load_json_file(catalog_schema)
  elif catalog_schema is None:
    catalog_schema = {"catalogId": "test_catalog", "components": {}}

  common_types_schema = catalog_config.get("common_types_schema")
  if isinstance(common_types_schema, str):
    common_types_schema = load_json_file(common_types_schema)
  elif common_types_schema is None:
    common_types_schema = {}

  return A2uiCatalog(
      version=version,
      name="test_catalog",
      s2c_schema=s2c_schema,
      common_types_schema=common_types_schema,
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
  catalog_config = test_case.get("catalog")
  if catalog_config is None:
    constructor = test_case["constructor"]
    version = constructor["version"]
    catalog_config = {
        "version": version,
        "s2c_schema": f"simplified_s2c_v{version.replace('.', '')}.json",
        "catalog_schema": constructor.get("catalog"),
    }
  catalog = setup_catalog(catalog_config)
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
  catalog_config = test_case.get("catalog")
  if catalog_config is None:
    constructor = test_case["constructor"]
    version = constructor["version"]
    catalog_config = {
        "version": version,
        "s2c_schema": f"simplified_s2c_v{version.replace('.', '')}.json",
        "catalog_schema": constructor.get("catalog"),
    }
  catalog = setup_catalog(catalog_config)
  validator = A2uiValidator(catalog=catalog)

  for case in test_case["validate"]:
    if "expect_error" in case:
      with pytest.raises(ValueError, match=case["expect_error"]):
        validator.validate(case["payload"])
    else:
      validator.validate(case["payload"])
