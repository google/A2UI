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
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from .loader import A2uiSchemaLoader, PackageLoader, FileSystemLoader
from ..inference_strategy import InferenceStrategy
from .constants import (
    A2UI_ASSET_PACKAGE,
    SERVER_TO_CLIENT_SCHEMA_KEY,
    COMMON_TYPES_SCHEMA_KEY,
    CATALOG_SCHEMA_KEY,
    CATALOG_COMPONENTS_KEY,
    CATALOG_ID_KEY,
    BASE_SCHEMA_URL,
    SPEC_VERSION_MAP,
    SPECIFICATION_DIR,
    INLINE_CATALOG_NAME,
    BASIC_CATALOG_NAME,
    find_repo_root,
)
from .catalog import CustomCatalogConfig, A2uiCatalog
from ...extension.a2ui_extension import INLINE_CATALOGS_KEY, SUPPORTED_CATALOG_IDS_KEY, get_a2ui_agent_extension
from a2a.types import AgentExtension


def _load_basic_component(version: str, spec_name: str) -> Dict:
  """Loads a basic schema component using fallback logic.

  Args:
    version: The version of the schema to load.
    spec_name: The name of the schema component (e.g. 'server_to_client', 'standard_catalog', 'common_types') to load.

  Returns:
    The loaded schema component.

  Raises:
    IOError: If the schema file cannot be loaded from any of the fallback locations.
  """

  spec_map = SPEC_VERSION_MAP[version]
  if spec_name not in spec_map:
    return None
  path = spec_map.get(spec_name)
  filename = os.path.basename(path)

  # 1. Try to load from package resources
  try:
    loader = PackageLoader(f"{A2UI_ASSET_PACKAGE}.{version}")
    return loader.load(filename)
  except IOError as e:
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

  raise IOError(f"Could not load schema {filename} for version {version}")


def _load_from_path(path: str) -> Dict:
  """Loads a schema from a direct file path."""
  try:
    loader = FileSystemLoader(os.path.dirname(path))
    return loader.load(os.path.basename(path))
  except Exception as e:
    raise ValueError(f"Failed to load schema at {path}: {e}")


class A2uiSchemaManager(InferenceStrategy):
  """Manages A2UI schema levels and prompt injection."""

  def __init__(
      self,
      version: str,
      basic_examples_path: Optional[str] = None,
      custom_catalogs: Optional[List[CustomCatalogConfig]] = None,
      exclude_basic_catalog: bool = False,
      accepts_inline_catalogs: bool = False,
  ):
    self._version = version
    self._exclude_basic_catalog = exclude_basic_catalog
    self._accepts_inline_catalogs = accepts_inline_catalogs

    self._server_to_client_schema = None
    self._common_types_schema = None
    self._supported_catalogs: Dict[str, A2uiCatalog] = {}
    self._catalog_example_paths: Dict[str, str] = {}
    self._basic_catalog = None
    self._load_schemas(version, custom_catalogs, basic_examples_path)

  @property
  def accepts_inline_catalogs(self) -> bool:
    return self._accepts_inline_catalogs

  @property
  def supported_catalogs(self) -> Dict[str, A2uiCatalog]:
    return self._supported_catalogs

  def _load_schemas(
      self,
      version: str,
      custom_catalogs: Optional[List[CustomCatalogConfig]] = None,
      basic_examples_path: Optional[str] = None,
  ):
    """Loads separate schema components and processes catalogs."""
    if version not in SPEC_VERSION_MAP:
      raise ValueError(
          f"Unknown A2UI specification version: {version}. Supported:"
          f" {list(SPEC_VERSION_MAP.keys())}"
      )

    # Load server-to-client and common types schemas
    self._server_to_client_schema = _load_basic_component(
        version, SERVER_TO_CLIENT_SCHEMA_KEY
    )
    self._common_types_schema = _load_basic_component(version, COMMON_TYPES_SCHEMA_KEY)

    # Process basic catalog
    basic_catalog_schema = _load_basic_component(version, CATALOG_SCHEMA_KEY)
    if not basic_catalog_schema:
      basic_catalog_schema = {}

    # Ensure catalog id and schema url are set in the basic catalog schema
    if CATALOG_ID_KEY not in basic_catalog_schema:
      catalog_file = (
          # Strip the `json/` part from the catalog file path.
          SPEC_VERSION_MAP[version][CATALOG_SCHEMA_KEY].replace("/json/", "/")
          if CATALOG_SCHEMA_KEY in SPEC_VERSION_MAP[version]
          else f"specification/{version}/standard_catalog.json"
      )
      basic_catalog_schema[CATALOG_ID_KEY] = BASE_SCHEMA_URL + catalog_file
    if "$schema" not in basic_catalog_schema:
      basic_catalog_schema["$schema"] = "https://json-schema.org/draft/2020-12/schema"

    self._basic_catalog = A2uiCatalog(
        version=version,
        name=BASIC_CATALOG_NAME,
        catalog_schema=basic_catalog_schema,
        s2c_schema=self._server_to_client_schema,
        common_types_schema=self._common_types_schema,
    )
    if not self._exclude_basic_catalog:
      self._supported_catalogs[self._basic_catalog.catalog_id] = self._basic_catalog
      self._catalog_example_paths[self._basic_catalog.catalog_id] = basic_examples_path

    # Process custom catalogs
    if custom_catalogs:
      for config in custom_catalogs:
        custom_catalog_schema = _load_from_path(config.catalog_path)
        resolved_catalog_schema = A2uiCatalog.resolve_schema(
            basic_catalog_schema, custom_catalog_schema
        )
        catalog = A2uiCatalog(
            version=version,
            name=config.name,
            catalog_schema=resolved_catalog_schema,
            s2c_schema=self._server_to_client_schema,
            common_types_schema=self._common_types_schema,
        )
        self._supported_catalogs[catalog.catalog_id] = catalog
        self._catalog_example_paths[catalog.catalog_id] = config.examples_path

  def _determine_catalog(
      self, client_ui_capabilities: Optional[dict[str, Any]] = None
  ) -> A2uiCatalog:
    """Determines the catalog to use based on supported catalog IDs.

    If neither inline catalogs nor supported catalog IDs are provided, the basic catalog is used.
    If inline catalogs are provided, the first inline catalog is used.
    If supported catalog IDs are provided, the first supported catalog that is recognized is used.

    Args:
      client_ui_capabilities: A dictionary of client UI capabilities.

    Returns:
      The A2uiCatalog to use to generate the schema string in the prompt.

    Raises:
      ValueError: If both inline catalogs and supported catalog IDs are provided,
        or if no supported catalog is recognized.
    """
    if not client_ui_capabilities or not isinstance(client_ui_capabilities, dict):
      return self._basic_catalog

    inline_catalogs: List[dict[str, Any]] = client_ui_capabilities.get(
        INLINE_CATALOGS_KEY, []
    )
    supported_catalog_ids: List[str] = client_ui_capabilities.get(
        SUPPORTED_CATALOG_IDS_KEY, []
    )

    if not self._accepts_inline_catalogs and inline_catalogs:
      raise ValueError(
          f"Inline catalog '{INLINE_CATALOGS_KEY}' is provided in client UI"
          " capabilities. However, the agent does not accept inline catalogs."
      )

    if inline_catalogs and supported_catalog_ids:
      raise ValueError(
          f"Both '{INLINE_CATALOGS_KEY}' and '{SUPPORTED_CATALOG_IDS_KEY}' "
          "are provided in client UI capabilities. Only one is allowed."
      )

    if inline_catalogs:
      # Load the first custom inline catalog schema.
      inline_catalog_schema = inline_catalogs[0]
      resolved_catalog_schema = A2uiCatalog.resolve_schema(
          self._basic_catalog.catalog_schema, inline_catalog_schema
      )
      return A2uiCatalog(
          version=self._version,
          name=INLINE_CATALOG_NAME,
          catalog_schema=resolved_catalog_schema,
          s2c_schema=self._server_to_client_schema,
          common_types_schema=self._common_types_schema,
      )

    if not supported_catalog_ids:
      return self._basic_catalog

    for scid in supported_catalog_ids:
      if scid in self._supported_catalogs:
        # Return the first supported catalog.
        return self._supported_catalogs[scid]

    raise ValueError(
        "No supported catalog found on the agent side. Agent supported catalogs are:"
        f" {list(self._supported_catalogs.keys())}"
    )

  def get_effective_catalog(
      self,
      client_ui_capabilities: Optional[dict[str, Any]] = None,
      allowed_components: List[str] = [],
  ) -> A2uiCatalog:
    """Gets the effective catalog after selection and component pruning."""
    catalog = self._determine_catalog(client_ui_capabilities)
    pruned_catalog = catalog.with_pruned_components(allowed_components)
    return pruned_catalog

  def load_examples(self, catalog: A2uiCatalog, validate: bool = False) -> str:
    """Loads examples for a catalog."""
    if catalog.catalog_id in self._catalog_example_paths:
      return catalog.load_examples(
          self._catalog_example_paths[catalog.catalog_id], validate=validate
      )
    return ""

  def generate_system_prompt(
      self,
      role_description: str,
      workflow_description: str = "",
      ui_description: str = "",
      client_ui_capabilities: Optional[dict[str, Any]] = None,
      allowed_components: List[str] = [],
      include_schema: bool = False,
      include_examples: bool = False,
      validate_examples: bool = False,
  ) -> str:
    """Assembles the final system instruction for the LLM."""
    parts = [role_description]
    if workflow_description:
      parts.append(f"## Workflow Description:\n{workflow_description}")
    if ui_description:
      parts.append(f"## UI Description:\n{ui_description}")

    final_catalog = self.get_effective_catalog(
        client_ui_capabilities, allowed_components
    )

    if include_schema:
      parts.append(final_catalog.render_as_llm_instructions())

    if include_examples:
      examples_str = self.load_examples(final_catalog, validate=validate_examples)
      if examples_str:
        parts.append(f"### Examples:\n{examples_str}")

    return "\n\n".join(parts)

  def get_agent_extension(self) -> AgentExtension:
    catalog_ids = self.catalog_schemas.keys()
    return get_a2ui_agent_extension(supported_catalog_ids=list(catalog_ids))
