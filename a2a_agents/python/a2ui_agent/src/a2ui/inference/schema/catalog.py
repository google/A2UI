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
import json
import logging
import os
from dataclasses import dataclass, replace
from typing import Any, Dict, List, Optional

from .constants import CATALOG_COMPONENTS_KEY, CATALOG_ID_KEY
from referencing import Registry, Resource


@dataclass
class CustomCatalogConfig:
  """Configuration for a custom component catalog."""

  name: str
  catalog_path: str
  examples_path: Optional[str] = None


@dataclass(frozen=True)
class A2uiCatalog:
  """Represents a processed component catalog with its schema.

  Attributes:
    version: The version of the catalog.
    name: The name of the catalog.
    s2c_schema: The server-to-client schema.
    common_types_schema: The common types schema.
    catalog_schema: The catalog schema.
  """

  version: str
  name: str
  s2c_schema: Dict[str, Any]
  common_types_schema: Dict[str, Any]
  catalog_schema: Dict[str, Any]

  @property
  def catalog_id(self) -> str:
    if CATALOG_ID_KEY not in self.catalog_schema:
      raise ValueError(f"Catalog '{self.name}' missing catalogId")
    return self.catalog_schema[CATALOG_ID_KEY]

  def with_pruned_components(self, allowed_components: List[str]) -> "A2uiCatalog":
    """Returns a new catalog with only allowed components.

    Args:
      allowed_components: List of component names to include.

    Returns:
      A copy of the catalog with only allowed components.
    """

    schema_copy = copy.deepcopy(self.catalog_schema)

    # Allow all components if no allowed components are specified
    if not allowed_components:
      return self

    if CATALOG_COMPONENTS_KEY in schema_copy and isinstance(
        schema_copy[CATALOG_COMPONENTS_KEY], dict
    ):
      all_comps = schema_copy[CATALOG_COMPONENTS_KEY]
      schema_copy[CATALOG_COMPONENTS_KEY] = {
          k: v for k, v in all_comps.items() if k in allowed_components
      }

    # Filter anyComponent oneOf if it exists
    # Path: $defs -> anyComponent -> oneOf
    if "$defs" in schema_copy and "anyComponent" in schema_copy["$defs"]:
      any_comp = schema_copy["$defs"]["anyComponent"]
      if "oneOf" in any_comp and isinstance(any_comp["oneOf"], list):
        filtered_one_of = []
        for item in any_comp["oneOf"]:
          if "$ref" in item:
            ref = item["$ref"]
            if ref.startswith(f"#/{CATALOG_COMPONENTS_KEY}/"):
              comp_name = ref.split("/")[-1]
              if comp_name in allowed_components:
                filtered_one_of.append(item)
            else:
              logging.warning(f"Skipping unknown ref format: {ref}")
          else:
            logging.warning(f"Skipping non-ref item in anyComponent oneOf: {item}")

        any_comp["oneOf"] = filtered_one_of

    return replace(self, catalog_schema=schema_copy)

  def render_as_llm_instructions(self) -> str:
    """Renders the catalog and schema as LLM instructions."""
    all_schemas = []
    all_schemas.append("---BEGIN A2UI JSON SCHEMA---")

    server_client_str = (
        json.dumps(self.s2c_schema, indent=2) if self.s2c_schema else "{}"
    )
    all_schemas.append(f"### Server To Client Schema:\n{server_client_str}")

    if self.common_types_schema:
      common_str = json.dumps(self.common_types_schema, indent=2)
      all_schemas.append(f"### Common Types Schema:\n{common_str}")

    catalog_str = json.dumps(self.catalog_schema, indent=2)
    all_schemas.append(f"### Catalog Schema:\n{catalog_str}")

    all_schemas.append("---END A2UI JSON SCHEMA---")

    return "\n\n".join(all_schemas)

  def load_examples(self, path: Optional[str]) -> str:
    """Loads and validates examples from a directory."""
    if not path or not os.path.isdir(path):
      if path:
        logging.warning(f"Example path {path} is not a directory")
      return ""

    merged_examples = []
    for filename in os.listdir(path):
      if filename.endswith(".json"):
        full_path = os.path.join(path, filename)
        basename = os.path.splitext(filename)[0]
        try:
          with open(full_path, "r", encoding="utf-8") as f:
            content = f.read()
            merged_examples.append(
                f"---BEGIN {basename}---\n{content}\n---END {basename}---"
            )
        except Exception as e:
          logging.warning(f"Failed to load example {full_path}: {e}")
    if not merged_examples:
      return ""
    return "\n\n".join(merged_examples)

  @staticmethod
  def resolve_schema(basic: Dict[str, Any], custom: Dict[str, Any]) -> Dict[str, Any]:
    """Resolves references in custom catalog schema against the basic catalog.

    Args:
      basic: The basic catalog schema.
      custom: The custom catalog schema.

    Returns:
      A new dictionary with references resolved.
    """
    result = copy.deepcopy(custom)

    # Initialize registry with basic catalog and maybe others from basic's $id
    registry = Registry()
    if CATALOG_ID_KEY in basic:
      basic_resource = Resource.from_contents(basic)
      registry = registry.with_resource(basic[CATALOG_ID_KEY], basic_resource)

    def resolve_ref(ref_uri: str) -> Any:
      try:
        resolver = registry.resolver()
        resolved = resolver.lookup(ref_uri)
        return resolved.contents
      except Exception as e:
        logging.warning("Could not resolve reference %s: %s", ref_uri, e)
        return None

    def merge_into(target: Dict[str, Any], source: Dict[str, Any]):
      for key, value in source.items():
        if key not in target:
          target[key] = copy.deepcopy(value)

    # Process components
    if CATALOG_COMPONENTS_KEY in result:
      comp_dict = result[CATALOG_COMPONENTS_KEY]
      if "$ref" in comp_dict:
        resolved = resolve_ref(comp_dict["$ref"])
        if isinstance(resolved, dict):
          merge_into(comp_dict, resolved)
        del comp_dict["$ref"]

    # Process functions
    if "functions" in result:
      func_dict = result["functions"]
      if "$ref" in func_dict:
        resolved = resolve_ref(func_dict["$ref"])
        if isinstance(resolved, dict):
          merge_into(func_dict, resolved)
        del func_dict["$ref"]

    # Process $defs
    if "$defs" in result:
      res_defs = result["$defs"]
      if "$ref" in res_defs:
        resolved = resolve_ref(res_defs["$ref"])
        if isinstance(resolved, dict):
          merge_into(res_defs, resolved)
        del res_defs["$ref"]

      for name in ["anyComponent", "anyFunction"]:
        if name in res_defs:
          target = res_defs[name]
          one_of = target.get("oneOf", [])
          new_one_of = []
          for item in one_of:
            if isinstance(item, dict) and "$ref" in item:
              ref_uri = item["$ref"]
              # Check if it points to basic collector
              resolved = resolve_ref(ref_uri)
              if isinstance(resolved, dict) and "oneOf" in resolved:
                # Merge oneOf items and resolve transitive refs to components/functions
                for sub_item in resolved["oneOf"]:
                  if sub_item not in new_one_of:
                    new_one_of.append(copy.deepcopy(sub_item))
                    # Transitive merge: if sub_item is a ref to a component/function
                    if isinstance(sub_item, dict) and "$ref" in sub_item:
                      sub_ref = sub_item["$ref"]
                      if (
                          sub_ref.startswith("#/components/")
                          and CATALOG_COMPONENTS_KEY in basic
                      ):
                        comp_name = sub_ref.split("/")[-1]
                        if comp_name in basic[CATALOG_COMPONENTS_KEY]:
                          if CATALOG_COMPONENTS_KEY not in result:
                            result[CATALOG_COMPONENTS_KEY] = {}
                          if comp_name not in result[CATALOG_COMPONENTS_KEY]:
                            result[CATALOG_COMPONENTS_KEY][comp_name] = copy.deepcopy(
                                basic[CATALOG_COMPONENTS_KEY][comp_name]
                            )
                      elif sub_ref.startswith("#/functions/") and "functions" in basic:
                        func_name = sub_ref.split("/")[-1]
                        if func_name in basic["functions"]:
                          if "functions" not in result:
                            result["functions"] = {}
                          if func_name not in result["functions"]:
                            result["functions"][func_name] = copy.deepcopy(
                                basic["functions"][func_name]
                            )
              else:
                new_one_of.append(item)
            else:
              new_one_of.append(item)
          target["oneOf"] = new_one_of

    return result
