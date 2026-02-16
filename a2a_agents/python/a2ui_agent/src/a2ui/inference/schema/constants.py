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

import os

A2UI_ASSET_PACKAGE = "a2ui.assets"
SERVER_TO_CLIENT_SCHEMA_KEY = "server_to_client"
COMMON_TYPES_SCHEMA_KEY = "common_types"
CATALOG_SCHEMA_KEY = "catalog"
CATALOG_COMPONENTS_KEY = "components"
CATALOG_ID_KEY = "catalogId"
CATALOG_STYLES_KEY = "styles"

BASE_SCHEMA_URL = "https://a2ui.org/"
BASIC_CATALOG_NAME = "basic"
INLINE_CATALOG_NAME = "inline"

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
