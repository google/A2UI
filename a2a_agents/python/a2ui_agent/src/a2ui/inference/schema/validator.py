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

import copy
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Set, Tuple

from jsonschema import Draft202012Validator

if TYPE_CHECKING:
  from .catalog import A2uiCatalog

from .constants import (
    BASE_SCHEMA_URL,
    CATALOG_COMPONENTS_KEY,
    CATALOG_ID_KEY,
    CATALOG_STYLES_KEY,
)


def _inject_additional_properties(
    schema: Dict[str, Any],
    source_properties: Dict[str, Any],
    mapping: Dict[str, str] = None,
) -> Tuple[Dict[str, Any], Set[str]]:
  """
  Recursively injects properties from source_properties into nodes with additionalProperties=True and sets additionalProperties=False.

  Args:
      schema: The target schema to traverse and patch.
      source_properties: A dictionary of top-level property groups (e.g., "components", "styles") from the source schema.

  Returns:
      A tuple containing:
      - The patched schema.
      - A set of keys from source_properties that were injected.
  """
  injected_keys = set()

  def recursive_inject(obj):
    if isinstance(obj, dict):
      new_obj = {}
      for k, v in obj.items():
        # If this node has additionalProperties=True, we inject the source properties
        if isinstance(v, dict) and v.get("additionalProperties") is True:
          if k in source_properties:
            injected_keys.add(k)
            new_node = dict(v)
            new_node["additionalProperties"] = False
            new_node["properties"] = {
                **new_node.get("properties", {}),
                **source_properties[k],
            }
            new_obj[k] = new_node
          else:  # No matching source group, keep as is but recurse children
            new_obj[k] = recursive_inject(v)
        else:  # Not a node with additionalProperties, recurse children
          new_obj[k] = recursive_inject(v)
      return new_obj
    elif isinstance(obj, list):
      return [recursive_inject(i) for i in obj]
    return obj

  return recursive_inject(schema), injected_keys


# LLM is instructed to generate a list of messages, so we wrap the bundled schema in an array.
def _wrap_main_schema(schema: Dict[str, Any]) -> Dict[str, Any]:
  return {"type": "array", "items": schema}


class A2uiValidator:
  """Validator for A2UI messages."""

  def __init__(self, catalog: "A2uiCatalog"):
    self._catalog = catalog
    self._validator = self._build_validator()

  def _build_validator(self) -> Draft202012Validator:
    """Builds a validator for the A2UI schema."""

    if self._catalog.version == "0.8":
      return self._build_0_8_validator()
    return self._build_0_9_validator()

  def _bundle_0_8_schemas(self) -> Dict[str, Any]:
    if not self._catalog.s2c_schema:
      return {}

    bundled = copy.deepcopy(self._catalog.s2c_schema)

    # Prepare catalog components and styles for injection
    source_properties = {}
    catalog_schema = self._catalog.catalog_schema
    if catalog_schema:
      if CATALOG_COMPONENTS_KEY in catalog_schema:
        # Special mapping for v0.8: "components" -> "component"
        source_properties["component"] = catalog_schema[CATALOG_COMPONENTS_KEY]
      if CATALOG_STYLES_KEY in catalog_schema:
        source_properties[CATALOG_STYLES_KEY] = catalog_schema[CATALOG_STYLES_KEY]

    bundled, _ = _inject_additional_properties(bundled, source_properties)
    return bundled

  def _build_0_8_validator(self) -> Draft202012Validator:
    """Builds a validator for the A2UI schema version 0.8."""
    bundled_schema = self._bundle_0_8_schemas()
    full_schema = _wrap_main_schema(bundled_schema)
    return Draft202012Validator(full_schema)

  def _build_0_9_validator(self) -> Draft202012Validator:
    """Builds a validator for the A2UI schema version 0.9+."""
    full_schema = _wrap_main_schema(self._catalog.s2c_schema)

    from referencing import Registry, Resource

    # v0.9 schemas (e.g. server_to_client.json) use relative references like
    # 'catalog.json#/$defs/anyComponent'. Since server_to_client.json has
    # $id: https://a2ui.org/specification/v0_9/server_to_client.json,
    # these resolve to https://a2ui.org/specification/v0_9/catalog.json.
    # We must register them using these absolute URIs.
    base_uri = self._catalog.s2c_schema.get("$id", BASE_SCHEMA_URL)
    from urllib.parse import urljoin

    def get_sibling_uri(uri, filename):
      # Ensure base ends with '/' so urljoin replaces only the last segment
      base = uri if uri.endswith("/") else uri.rsplit("/", 1)[0] + "/"
      return urljoin(base, filename)

    catalog_uri = get_sibling_uri(base_uri, "catalog.json")
    common_types_uri = get_sibling_uri(base_uri, "common_types.json")

    resources = [
        (
            common_types_uri,
            Resource.from_contents(self._catalog.common_types_schema),
        ),
        (
            catalog_uri,
            Resource.from_contents(self._catalog.catalog_schema),
        ),
        # Fallbacks for robustness
        ("catalog.json", Resource.from_contents(self._catalog.catalog_schema)),
        (
            "common_types.json",
            Resource.from_contents(self._catalog.common_types_schema),
        ),
    ]
    # Also register the catalog ID if it's different from the catalog URI
    if self._catalog.catalog_id and self._catalog.catalog_id != catalog_uri:
      resources.append((
          self._catalog.catalog_id,
          Resource.from_contents(self._catalog.catalog_schema),
      ))

    registry = Registry().with_resources(resources)
    validator_schema = copy.deepcopy(full_schema)
    validator_schema["$schema"] = "https://json-schema.org/draft/2020-12/schema"

    return Draft202012Validator(validator_schema, registry=registry)

  def validate(self, message: Dict[str, Any]) -> None:
    """Validates an A2UI message against the schema."""
    error = next(self._validator.iter_errors(message), None)
    if error is not None:
      msg = f"Validation failed: {error.message}"
      if error.context:
        msg += "\nContext failures:"
        for sub_error in error.context:
          msg += f"\n  - {sub_error.message}"
      raise ValueError(msg)
