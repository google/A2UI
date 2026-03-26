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
from dataclasses import dataclass, field, replace
from typing import Any, Dict, List, Optional, TYPE_CHECKING

from .catalog_provider import A2uiCatalogProvider, FileSystemCatalogProvider
from .constants import CATALOG_COMPONENTS_KEY, CATALOG_ID_KEY


@dataclass
class CatalogConfig:
  """
  Configuration for a catalog of components.

  A catalog consists of a provider that knows how to load the schema,
  and optionally a path to examples.

  Attributes:
    name: The name of the catalog.
    provider: The provider to use to load the catalog schema.
    examples_path: The path to the examples directory.
  """

  name: str
  provider: A2uiCatalogProvider
  examples_path: Optional[str] = None

  @classmethod
  def from_path(
      cls, name: str, catalog_path: str, examples_path: Optional[str] = None
  ) -> "CatalogConfig":
    """Returns a CatalogConfig that loads from a file path."""
    return cls(
        name=name,
        provider=FileSystemCatalogProvider(catalog_path),
        examples_path=examples_path,
    )


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

  @property
  def validator(self) -> "A2uiValidator":
    from .validator import A2uiValidator

    return A2uiValidator(self)

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

  def load_examples(self, path: Optional[str], validate: bool = False) -> str:
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
        with open(full_path, "r", encoding="utf-8") as f:
          content = f.read()

        if validate:
          self._validate_example(full_path, basename, content)

        merged_examples.append(
            f"---BEGIN {basename}---\n{content}\n---END {basename}---"
        )

    if not merged_examples:
      return ""
    return "\n\n".join(merged_examples)

  def _validate_example(self, full_path: str, basename: str, content: str) -> None:
    try:
      json_data = json.loads(content)
      self.validator.validate(json_data)
    except Exception as e:
      raise ValueError(f"Failed to validate example {full_path}: {e}") from e
