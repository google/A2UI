# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import yaml
import pytest
from a2ui.schema.catalog import A2uiCatalog
from a2ui.parser.streaming import A2uiStreamParser
from a2ui.schema.validator import A2uiValidator

import json


def _get_conformance_path(filename):
  return os.path.abspath(
      os.path.join(os.path.dirname(__file__), "../../../conformance", filename)
  )


def load_json_file(filename):
  path = _get_conformance_path(filename)
  with open(path, "r", encoding="utf-8") as f:
    return json.load(f)


def load_tests(filename):
  path = _get_conformance_path(filename)
  with open(path, "r", encoding="utf-8") as f:
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
    assert actual.text == expected.get("text", "")
    assert actual.a2ui_json == expected.get("a2ui")


def get_conformance_cases(filename):
  cases = load_tests(filename)
  return [(case["name"], case) for case in cases]


cases_parser = get_conformance_cases("parser.yaml")


@pytest.mark.parametrize(
    "name, test_case", cases_parser, ids=[c[0] for c in cases_parser]
)
def test_parser_conformance(name, test_case):
  catalog_config = test_case["catalog"]
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


cases_validator = get_conformance_cases("validator.yaml")


@pytest.mark.parametrize(
    "name, test_case", cases_validator, ids=[c[0] for c in cases_validator]
)
def test_validator_conformance(name, test_case):
  catalog_config = test_case["catalog"]
  catalog = setup_catalog(catalog_config)

  for case in test_case["validate"]:
    validator = A2uiValidator(catalog=catalog)
    if "expect_error" in case:
      with pytest.raises(ValueError, match=case["expect_error"]):
        validator.validate(case["payload"])
    else:
      validator.validate(case["payload"])
