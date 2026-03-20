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
from typing import List, Dict, Any, Optional, Callable
from dataclasses import dataclass, field
from .utils import load_from_bundled_resource
from ..inference_strategy import InferenceStrategy
from .constants import *
from .catalog import CatalogConfig, A2uiCatalog


class A2uiSchemaManager(InferenceStrategy):
  """Manages A2UI schema levels and prompt injection."""

  def __init__(
      self,
      version: Union[str, List[str]],
      catalogs: Optional[List[CatalogConfig]] = None,
      accepts_inline_catalogs: bool = False,
      schema_modifiers: Optional[
          List[Callable[[Dict[str, Any]], Dict[str, Any]]]
      ] = None,
  ):
    # Handle single or multiple versions
    self._versions = [version] if isinstance(version, str) else version
    self._accepts_inline_catalogs = accepts_inline_catalogs
    self._schema_modifiers = schema_modifiers or []

    # Internal state per version: {version: {s2c, common, catalogs, example_paths}}
    self._versioned_data: Dict[str, Any] = {}

    for v in self._versions:
      self._load_schemas(v, catalogs or [])

  @property
  def version(self) -> str:
    """Returns the primary version (first in the list)."""
    return self._versions[0]

  @property
  def accepts_inline_catalogs(self) -> bool:
    return self._accepts_inline_catalogs

  @property
  def supported_catalog_ids(self) -> List[str]:
    """Returns catalog IDs for the primary version."""
    return self.get_supported_catalog_ids(self.version)

  def get_supported_catalog_ids(self, version: str) -> List[str]:
    """Returns catalog IDs for a specific version."""
    if version not in self._versioned_data:
      return []
    return [c.catalog_id for c in self._versioned_data[version]["catalogs"]]

  def _apply_modifiers(self, schema: Dict[str, Any]) -> Dict[str, Any]:
    if self._schema_modifiers:
      for modifier in self._schema_modifiers:
        schema = modifier(schema)
    return schema

  def _load_schemas(
      self,
      version: str,
      catalogs: List[CatalogConfig] = [],
  ):
    """Loads separate schema components and processes catalogs for a version."""
    if version not in SPEC_VERSION_MAP:
      raise ValueError(
          f"Unknown A2UI specification version: {version}. Supported:"
          f" {list(SPEC_VERSION_MAP.keys())}"
      )

    # Load schemas for this version
    s2c_schema = self._apply_modifiers(
        load_from_bundled_resource(
            version, SERVER_TO_CLIENT_SCHEMA_KEY, SPEC_VERSION_MAP
        )
    )
    common_types_schema = self._apply_modifiers(
        load_from_bundled_resource(version, COMMON_TYPES_SCHEMA_KEY, SPEC_VERSION_MAP)
    )

    supported_catalogs: List[A2uiCatalog] = []
    catalog_example_paths: Dict[str, str] = {}

    # Process catalogs
    for config in catalogs:
      # If config has an explicit version and doesn't match, skip
      if config.version and config.version != version:
        continue

      # Some providers might be version-aware or have versioned filenames
      # We attempt to load the catalog. If it fails (e.g. file not found for this version), we skip.
      try:
        catalog_schema = config.provider.load()
        # Basic filtering: check if catalog identifies as this version or doesn't specify
        # (Often catalogs are shared or have external versioning)
        catalog_schema = self._apply_modifiers(catalog_schema)
        catalog = A2uiCatalog(
            version=version,
            name=config.name,
            catalog_schema=catalog_schema,
            s2c_schema=s2c_schema,
            common_types_schema=common_types_schema,
        )
        supported_catalogs.append(catalog)
        catalog_example_paths[catalog.catalog_id] = config.examples_path
      except Exception as e:
        logger.warning(
            f"Failed to load catalog {config.name} for version {version}: {e}"
        )

    self._versioned_data[version] = {
        "s2c": s2c_schema,
        "common": common_types_schema,
        "catalogs": supported_catalogs,
        "example_paths": catalog_example_paths,
    }

  def select_version(
      self, client_ui_capabilities: Optional[dict[str, Any]] = None
  ) -> str:
    """Selects the best A2UI version based on client capabilities.

    Preference is given to the agent's supported versions in order.
    """
    if not client_ui_capabilities:
      return self.version

    client_supported_catalog_ids = client_ui_capabilities.get(
        SUPPORTED_CATALOG_IDS_KEY, []
    )

    if not client_supported_catalog_ids:
      return self.version

    # Check each version in preference order
    for v in self._versions:
      agent_v_catalog_ids = self.get_supported_catalog_ids(v)
      # If there's any overlap, this version is a candidate
      if any(cid in agent_v_catalog_ids for cid in client_supported_catalog_ids):
        return v

    return self.version  # Default fallback

  def _select_catalog(
      self,
      client_ui_capabilities: Optional[dict[str, Any]] = None,
      version: Optional[str] = None,
  ) -> A2uiCatalog:
    """Selects the component catalog for the prompt based on client capabilities."""
    version = version or self.version
    if version not in self._versioned_data:
      raise ValueError(f"Version {version} not supported by this manager.")

    v_data = self._versioned_data[version]
    supported_catalogs = v_data["catalogs"]
    s2c_schema = v_data["s2c"]
    common_types_schema = v_data["common"]

    if not supported_catalogs:
      raise ValueError(f"No supported catalogs found for version {version}.")

    if not client_ui_capabilities or not isinstance(client_ui_capabilities, dict):
      return supported_catalogs[0]

    inline_catalogs: List[dict[str, Any]] = client_ui_capabilities.get(
        INLINE_CATALOGS_KEY, []
    )
    client_supported_catalog_ids: List[str] = client_ui_capabilities.get(
        SUPPORTED_CATALOG_IDS_KEY, []
    )

    if not self._accepts_inline_catalogs and inline_catalogs:
      raise ValueError(
          f"Inline catalog '{INLINE_CATALOGS_KEY}' is provided in client UI"
          " capabilities. However, the agent does not accept inline catalogs."
      )

    if inline_catalogs:
      # Determine the base catalog
      base_catalog = supported_catalogs[0]
      if client_supported_catalog_ids:
        agent_supported_catalogs = {c.catalog_id: c for c in supported_catalogs}
        for cscid in client_supported_catalog_ids:
          if cscid in agent_supported_catalogs:
            base_catalog = agent_supported_catalogs[cscid]
            break

      merged_schema = copy.deepcopy(base_catalog.catalog_schema)

      for inline_catalog_schema in inline_catalogs:
        inline_catalog_schema = self._apply_modifiers(inline_catalog_schema)
        inline_components = inline_catalog_schema.get(CATALOG_COMPONENTS_KEY, {})
        merged_schema[CATALOG_COMPONENTS_KEY].update(inline_components)

      return A2uiCatalog(
          version=version,
          name=INLINE_CATALOG_NAME,
          catalog_schema=merged_schema,
          s2c_schema=s2c_schema,
          common_types_schema=common_types_schema,
      )

    if not client_supported_catalog_ids:
      return supported_catalogs[0]

    agent_supported_catalogs = {c.catalog_id: c for c in supported_catalogs}
    for cscid in client_supported_catalog_ids:
      if cscid in agent_supported_catalogs:
        return agent_supported_catalogs[cscid]

    raise ValueError(
        f"No client-supported catalog found on the agent side for version {version}. "
        f"Agent-supported catalogs are: {[c.catalog_id for c in supported_catalogs]}"
    )

  def get_selected_catalog(
      self,
      client_ui_capabilities: Optional[dict[str, Any]] = None,
      allowed_components: List[str] = [],
      version: Optional[str] = None,
  ) -> A2uiCatalog:
    """Gets the selected catalog after selection and component pruning."""
    catalog = self._select_catalog(client_ui_capabilities, version=version)
    pruned_catalog = catalog.with_pruned_components(allowed_components)
    return pruned_catalog

  def load_examples(self, catalog: A2uiCatalog, validate: bool = False) -> str:
    """Loads examples for a catalog."""
    version = catalog.version
    if version in self._versioned_data:
      example_paths = self._versioned_data[version]["example_paths"]
      if catalog.catalog_id in example_paths:
        return catalog.load_examples(
            example_paths[catalog.catalog_id], validate=validate
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
      version: Optional[str] = None,
  ) -> str:
    """Assembles the final system instruction for the LLM."""
    parts = [role_description]

    workflow = DEFAULT_WORKFLOW_RULES
    if workflow_description:
      workflow += f"\n{workflow_description}"
    parts.append(f"## Workflow Description:\n{workflow}")

    if ui_description:
      parts.append(f"## UI Description:\n{ui_description}")

    selected_catalog = self.get_selected_catalog(
        client_ui_capabilities, allowed_components, version=version
    )

    if include_schema:
      parts.append(selected_catalog.render_as_llm_instructions())

    if include_examples:
      examples_str = self.load_examples(selected_catalog, validate=validate_examples)
      if examples_str:
        parts.append(f"### Examples:\n{examples_str}")

    return "\n\n".join(parts)
