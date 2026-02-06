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

from typing import Any, Dict
import jsonschema


class A2uiValidator:
  """
  Validates JSON instances against a bundled A2UI schema.
  """

  def __init__(self, schema: Dict[str, Any]):
    self._validator = jsonschema.validators.validator_for(schema)(schema)

  def validate(self, instance: Any) -> None:
    """
    Validates the given instance against the bundled schema.
    Raises jsonschema.exceptions.ValidationError if validation fails.
    """
    self._validator.validate(instance)
