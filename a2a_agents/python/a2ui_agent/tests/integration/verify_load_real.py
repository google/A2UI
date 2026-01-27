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

import sys

from a2ui.inference.schema.manager import A2uiSchemaManager
from a2ui.inference.schema.constants import CATALOG_COMPONENTS_KEY


def verify():
  print("Verifying A2uiSchemaManager...")
  try:
    manager = A2uiSchemaManager("0.8")
    catalog = manager.get_effective_catalog()
    catalog_components = catalog.catalog_schema[CATALOG_COMPONENTS_KEY]
    print(f"Successfully loaded 0.8: {len(catalog_components)} components")
    print(f"Components found: {list(catalog_components.keys())[:5]}...")
  except Exception as e:
    print(f"Failed to load 0.8: {e}")
    sys.exit(1)

  try:
    manager = A2uiSchemaManager("0.9")
    catalog = manager.get_effective_catalog()
    catalog_components = catalog.catalog_schema[CATALOG_COMPONENTS_KEY]
    print(f"Successfully loaded 0.9: {len(catalog_components)} components")
    print(f"Components found: {list(catalog_components.keys())}...")
  except Exception as e:
    print(f"Failed to load 0.9: {e}")
    sys.exit(1)


if __name__ == "__main__":
  verify()
