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

import importlib.util
import os
import shutil
from hatchling.builders.hooks.plugin.interface import BuildHookInterface


def load_constants(project_root):
  """Loads the shared constants module directly from its path in src/."""
  constants_path = os.path.join(
      project_root, "src", "a2ui", "inference", "schema", "constants.py"
  )
  if not os.path.exists(constants_path):
    raise RuntimeError(f"Could not find shared constants at {constants_path}")

  spec = importlib.util.spec_from_file_location("_constants_load", constants_path)
  if spec and spec.loader:
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module
  raise RuntimeError(f"Could not load shared constants from {constants_path}")


class PackSpecsBuildHook(BuildHookInterface):

  def initialize(self, version, build_data):
    project_root = self.root

    # Load constants dynamically from src/a2ui/inference/schema/constants.py
    a2ui_constants = load_constants(project_root)

    spec_version_map = a2ui_constants.SPEC_VERSION_MAP
    a2ui_asset_package = a2ui_constants.A2UI_ASSET_PACKAGE
    specification_dir = a2ui_constants.SPECIFICATION_DIR

    # project root is in a2a_agents/python/a2ui_agent
    # Dynamically find repo root by looking for specification_dir
    repo_root = a2ui_constants.find_repo_root(project_root)
    if not repo_root:
      # Check for PKG-INFO which implies a packaged state (sdist).
      # If PKG-INFO is present, trust the bundled assets.
      if os.path.exists(os.path.join(project_root, "PKG-INFO")):
        print("Repository root not found, but PKG-INFO present (sdist). Skipping copy.")
        return

      raise RuntimeError(
          f"Could not find repository root (looked for '{specification_dir}'"
          " directory)."
      )

    # Target directory: src/a2ui/assets
    target_base = os.path.join(
        project_root, "src", a2ui_asset_package.replace(".", os.sep)
    )

    for ver, schema_map in spec_version_map.items():
      target_dir = os.path.join(target_base, ver)
      os.makedirs(target_dir, exist_ok=True)

      for _schema_key, source_rel_path in schema_map.items():
        source_path = os.path.join(repo_root, source_rel_path)

        if not os.path.exists(source_path):
          print(
              f"WARNING: Source schema file not found at {source_path}. Build"
              " might produce incomplete wheel if not running from monorepo"
              " root."
          )
          continue

        filename = os.path.basename(source_path)
        dst_file = os.path.join(target_dir, filename)

        print(f"Copying {source_path} -> {dst_file}")
        shutil.copy2(source_path, dst_file)
