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

"""Module for providing A2UI catalog schemas and resources."""

import json
import logging
import os
import importlib.resources
from abc import ABC, abstractmethod
from json.decoder import JSONDecodeError
from typing import Any, Dict, Optional

from .constants import (
    A2UI_ASSET_PACKAGE,
    BASE_SCHEMA_URL,
    CATALOG_ID_KEY,
    CATALOG_SCHEMA_KEY,
    SPEC_VERSION_MAP,
    find_repo_root,
)

ENCODING = "utf-8"


class A2uiCatalogProvider(ABC):
  """Abstract base class for providing A2UI schemas and catalogs."""

  @abstractmethod
  def load(self) -> Dict[str, Any]:
    """Loads a schema resource.

    Returns:
      The loaded schema as a dictionary.
    """
    pass


class FileSystemCatalogProvider(A2uiCatalogProvider):
  """Loads schemas from the local filesystem."""

  def __init__(self, path: str):
    self.path = path

  def load(self) -> Dict[str, Any]:
    try:
      with open(self.path, "r", encoding=ENCODING) as f:
        return json.load(f)
    except (FileNotFoundError, JSONDecodeError) as e:
      raise IOError(f"Could not load schema from {self.path}: {e}") from e


def load_from_bundled_resource(version: str, resource_key: str) -> Dict[str, Any]:
  """Loads a schema resource from bundled package resources."""
  spec_map = SPEC_VERSION_MAP.get(version)
  if not spec_map:
    raise ValueError(f"Unknown A2UI version: {version}")

  if resource_key not in spec_map:
    return None

  rel_path = spec_map[resource_key]
  filename = os.path.basename(rel_path)

  # 1. Try to load from the bundled package resources.
  try:
    traversable = importlib.resources.files(A2UI_ASSET_PACKAGE)
    traversable = traversable.joinpath(version).joinpath(filename)
    with traversable.open("r", encoding=ENCODING) as f:
      return json.load(f)
  except Exception as e:
    logging.debug("Could not load '%s' from package resources: %s", filename, e)

  # 2. Fallback to local assets
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
    if os.path.exists(potential_path):
      provider = FileSystemCatalogProvider(potential_path)
      return provider.load()
  except Exception as e:
    logging.debug("Could not load schema '%s' from local assets: %s", filename, e)

  # 3. Fallback: Source Repository (specification/...)
  # This handles cases where we are running directly from source tree
  # And assets are not yet copied to src/a2ui/assets
  # manager.py is at a2a_agents/python/a2ui_agent/src/a2ui/inference/schema/manager.py
  # Dynamically find repo root by looking for "specification" directory
  try:
    repo_root = find_repo_root(os.path.dirname(__file__))
    if repo_root:
      source_path = os.path.join(repo_root, rel_path)
      if os.path.exists(source_path):
        provider = FileSystemCatalogProvider(source_path)
        return provider.load()
  except Exception as e:
    logging.debug("Could not load schema from source repo: %s", e)

  raise IOError(f"Could not load schema {filename} for version {version}")


class BundledCatalogProvider(A2uiCatalogProvider):
  """Loads schemas from bundled package resources with fallbacks."""

  def __init__(self, version: str):
    self.version = version

  def load(self) -> Dict[str, Any]:

    resource = load_from_bundled_resource(self.version, CATALOG_SCHEMA_KEY)

    # Post-load processing for catalogs
    if CATALOG_ID_KEY not in resource:
      spec_map = SPEC_VERSION_MAP.get(self.version)
      rel_path = spec_map[CATALOG_SCHEMA_KEY]
      # Strip the `json/` part from the catalog file path for the ID.
      catalog_file = rel_path.replace("/json/", "/")
      resource[CATALOG_ID_KEY] = BASE_SCHEMA_URL + catalog_file

    if "$schema" not in resource:
      resource["$schema"] = "https://json-schema.org/draft/2020-12/schema"

    return resource
