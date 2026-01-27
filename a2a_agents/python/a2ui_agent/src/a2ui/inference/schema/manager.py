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
import importlib.resources
from typing import List, Dict, Any
from .loader import A2uiSchemaLoader, PackageLoader, FileSystemLoader
from ..inference_strategy import InferenceStrategy

# Helper constants for schema management shared by build hook and runtime

# Mapping of version to the relative path of the source schema in the monorepo
# Paths are relative to the repository root
A2UI_ASSET_PACKAGE = "a2ui.assets"
SERVER_TO_CLIENT_SCHEMA_KEY = "server_to_client"
COMMON_TYPES_SCHEMA_KEY = "common_types"
CATALOG_SCHEMA_KEY = "catalog"
CATALOG_COMPONENTS_KEY = "components"

SPEC_VERSION_MAP = {
    "0.8": {
        SERVER_TO_CLIENT_SCHEMA_KEY: "specification/v0_8/json/server_to_client.json",
        CATALOG_SCHEMA_KEY: "specification/v0_8/json/standard_catalog_definition.json",
    },
    "0.9": {
        SERVER_TO_CLIENT_SCHEMA_KEY: "specification/v0_9/json/server_to_client.json",
        CATALOG_SCHEMA_KEY: "specification/v0_9/json/standard_catalog.json",
        COMMON_TYPES_SCHEMA_KEY: "specification/v0_9/json/common_types.json",
    },
}

SPECIFICATION_DIR = "specification"


class A2uiSchemaManager(InferenceStrategy):
  """Manages A2UI schema pruning and prompt injection."""

  def __init__(self, version: str, custom_catalog_path: str = None):
    self.version = version
    self.server_to_client_schema = None
    self.catalog_schema = None
    self.common_types_schema = None
    self._load_schemas(version, custom_catalog_path)

  def _load_schemas(self, version: str, custom_catalog_path: str = None):
    """
    Loads separate schema components.
    """
    if version in SPEC_VERSION_MAP:
      spec_map = SPEC_VERSION_MAP[version]

      self.server_to_client_schema = self._load_schema(
          version, spec_map.get(SERVER_TO_CLIENT_SCHEMA_KEY)
      )
      if COMMON_TYPES_SCHEMA_KEY in spec_map:
        self.common_types_schema = self._load_schema(
            version, spec_map.get(COMMON_TYPES_SCHEMA_KEY)
        )

      if custom_catalog_path:
        self.catalog_schema = self._load_from_path(custom_catalog_path)
      elif CATALOG_SCHEMA_KEY in spec_map:
        self.catalog_schema = self._load_schema(
            version, spec_map.get(CATALOG_SCHEMA_KEY)
        )
      else:
        raise ValueError(f"Could not load catalog schema for version {version}")
    else:
      raise ValueError(
          f"Unknown A2UI specification version: {version}. Supported:"
          f" {list(SPEC_VERSION_MAP.keys())}"
      )

  def _load_schema(self, version: str, path: str) -> Dict:
    if not path:
      return {}

    filename = os.path.basename(path)

    # 1. Try to load from package resources
    try:
      loader = PackageLoader(f"{A2UI_ASSET_PACKAGE}.{version}")
      return loader.load(filename)
    except Exception as e:
      logging.debug("Could not load schema '%s' from package: %s", filename, e)

    # 2. Fallback: Local Assets
    # This handles cases where assets might be present in src but not installed
    try:
      potential_path = os.path.abspath(
          os.path.join(
              os.path.dirname(__file__),
              "..",
              "assets",
              version,
              filename,
          )
      )
      loader = FileSystemLoader(os.path.dirname(potential_path))
      return loader.load(filename)
    except Exception as e:
      logging.debug("Could not load schema '%s' from local assets: %s", filename, e)

    # 3. Fallback: Source Repository (specification/...)
    # This handles cases where we are running directly from source tree
    # And assets are not yet copied to src/a2ui/assets
    # schema_manager.py is at a2a_agents/python/a2ui_agent/src/a2ui/inference/schema/manager.py
    # Dynamically find repo root by looking for "specification" directory
    try:
      repo_root = find_repo_root(os.path.dirname(__file__))
    except Exception as e:
      logging.debug("Could not find repo root: %s", e)

    if repo_root:
      source_path = os.path.join(repo_root, path)
      if os.path.exists(source_path):
        loader = FileSystemLoader(os.path.dirname(source_path))
        return loader.load(filename)

    raise IOError(
        f"Could not load schema component {filename} for version {version}"
    ) from e

  def _load_from_path(self, path: str) -> Dict:
    try:
      loader = FileSystemLoader(os.path.dirname(path))
      return loader.load(os.path.basename(path))
    except Exception as e:
      raise ValueError(f"Failed to load custom catalog at {path}: {e}")

  def get_pruned_catalog(self, selected_components: List[str] = None) -> Dict:
    """Dynamically filters the catalog to reduce context window tokens."""
    if not self.catalog_schema:
      return {}

    schema = copy.deepcopy(self.catalog_schema)

    # If no components selected, return full catalog
    if not selected_components:
      return schema

    if CATALOG_COMPONENTS_KEY in schema and isinstance(
        schema[CATALOG_COMPONENTS_KEY], dict
    ):
      all_comps = schema[CATALOG_COMPONENTS_KEY]
      schema[CATALOG_COMPONENTS_KEY] = {
          k: v for k, v in all_comps.items() if k in selected_components
      }

    # Filter anyComponent oneOf if it exists
    # Path: $defs -> anyComponent -> oneOf
    if "$defs" in schema and "anyComponent" in schema["$defs"]:
      any_comp = schema["$defs"]["anyComponent"]
      if "oneOf" in any_comp and isinstance(any_comp["oneOf"], list):
        filtered_one_of = []
        for item in any_comp["oneOf"]:
          if "$ref" in item:
            ref = item["$ref"]
            if ref.startswith(f"#/{CATALOG_COMPONENTS_KEY}/"):
              comp_name = ref.split("/")[-1]
              if comp_name in selected_components:
                filtered_one_of.append(item)
            else:
              logging.warning(f"Skipping unknown ref format: {ref}")
          else:
            logging.warning(f"Skipping non-ref item in anyComponent oneOf: {item}")

        any_comp["oneOf"] = filtered_one_of

    return schema

  def generate_system_prompt(
      self,
      role_description: str,
      workflow_description: str = "",
      ui_description: str = "",
      selected_components: List[str] = [],
      examples: str = "",
  ) -> str:
    """Assembles the final system instruction for the LLM."""
    catalog_str = json.dumps(self.get_pruned_catalog(selected_components), indent=2)
    server_client_str = (
        json.dumps(self.server_to_client_schema, indent=2)
        if self.server_to_client_schema
        else "{}"
    )

    parts = [role_description]
    if workflow_description:
      parts.append(f"## Workflow Description:\n{workflow_description}")
    if ui_description:
      parts.append(f"## UI Description:\n{ui_description}")

    if examples:
      parts.append(f"## Examples:\n{examples}")

    parts.append("---BEGIN A2UI JSON SCHEMA---")
    parts.append(f"### Server To Client Schema:\n{server_client_str}")

    if self.common_types_schema:
      common_str = json.dumps(self.common_types_schema, indent=2)
      parts.append(f"### Common Types Schema:\n{common_str}")

    parts.append(f"### Catalog Schema:\n{catalog_str}")
    parts.append("---END A2UI JSON SCHEMA---")

    return "\n\n".join(parts)


def find_repo_root(start_path: str) -> str | None:
  """Finds the repository root by looking for the 'specification' directory."""
  current = os.path.abspath(start_path)
  while True:
    if os.path.isdir(os.path.join(current, SPECIFICATION_DIR)):
      return current
    parent = os.path.dirname(current)
    if parent == current:
      return None
    current = parent
