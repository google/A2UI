import os
import shutil
import sys
from hatchling.builders.hooks.plugin.interface import BuildHookInterface


class PackSpecsBuildHook(BuildHookInterface):

  def initialize(self, version, build_data):
    project_root = self.root

    # Add src to sys.path to import the constant
    src_path = os.path.join(project_root, "src")
    if src_path not in sys.path:
      sys.path.insert(0, src_path)

    from a2ui.inference.schema.manager import (
        SPEC_VERSION_MAP,
        A2UI_ASSET_PACKAGE,
        SPECIFICATION_DIR,
        find_repo_root,
    )

    # project root is in a2a_agents/python/a2ui_agent
    # Dynamically find repo root by looking for SPECIFICATION_DIR
    repo_root = find_repo_root(project_root)
    if not repo_root:
      # Check for PKG-INFO which implies a packaged state (sdist).
      # If PKG-INFO is present, trust the bundled assets.
      if os.path.exists(os.path.join(project_root, "PKG-INFO")):
        print("Repository root not found, but PKG-INFO present (sdist). Skipping copy.")
        return

      raise RuntimeError(
          f"Could not find repository root (looked for '{SPECIFICATION_DIR}'"
          " directory)."
      )

    # Target directory: src/a2ui/assets
    target_base = os.path.join(
        project_root, "src", A2UI_ASSET_PACKAGE.replace(".", os.sep)
    )

    for ver, schema_map in SPEC_VERSION_MAP.items():
      target_dir = os.path.join(target_base, ver)
      os.makedirs(target_dir, exist_ok=True)

      for _schema_key, source_rel_path in schema_map.items():
        source_path = os.path.join(repo_root, source_rel_path)

        if not os.path.exists(source_path):
          print(
              f"WARNING: Source schema file not found at {source_path}. Build might"
              " produce incomplete wheel if not running from monorepo root."
          )
          continue

        filename = os.path.basename(source_path)
        dst_file = os.path.join(target_dir, filename)

        print(f"Copying {source_path} -> {dst_file}")
        shutil.copy2(source_path, dst_file)
