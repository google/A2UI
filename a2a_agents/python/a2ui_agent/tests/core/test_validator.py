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

import pytest
import jsonschema
from a2ui.core.validator import A2uiValidator


@pytest.fixture
def mock_bundled_schema():
  return {
      "type": "array",
      "items": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "type": "object",
          "properties": {"foo": {"type": "string"}},
          "required": ["foo"],
      },
  }


def test_validation_success(mock_bundled_schema):
  validator = A2uiValidator(mock_bundled_schema)
  instance = [{"foo": "bar"}]
  validator.validate(instance)


def test_validation_failure(mock_bundled_schema):
  validator = A2uiValidator(mock_bundled_schema)
  instance = [{"foo": 123}]  # Wrong type

  with pytest.raises(jsonschema.exceptions.ValidationError):
    validator.validate(instance)
