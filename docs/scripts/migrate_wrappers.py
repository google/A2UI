
import os
import shutil
import re

"""
Generates and migrates "wrapper" Markdown files for the A2UI specification documentation.

This script manages the documentation pages that wrap the raw specification content:
1.  **Generates Wrappers**: Reads template/wrapper files from `docs/wrappers_source/`. These files contain metadata headers and include directives (e.g., `--8<--`) that pull in the raw specification content prepared by `prepare_docs.py`.
2.  **Version Filtering**: Identifies which version each wrapper corresponds to based on its filename (e.g., `v0.9-a2ui.md` belongs to `v0.9`).
3.  **Updates Include Paths**: Dynamically rewrites the include directives to point to the correct location of the raw specification files in the build directory (e.g., changing `docs/specification/v0_9/...` to `docs/v0.9/specification/...`).
4.  **Fixes Cross-Version Links**: Rewrites links within the wrapper files to ensure they point to the correct versioned documentation pages. For example, it converts links like `(v0.8-a2ui.md)` to relative paths like `(../../../v0.8/specification/docs/v0.8-a2ui.md)` when linking across versions.
5.  **Deploys to Documentation**: Places the processed wrapper files into the appropriate versioned specification directory (e.g., `docs/v0.9/specification/docs/`).

Usage:
    Run this script after `prepare_docs.py` and before `mkdocs build`.
    `python3 docs/scripts/migrate_wrappers.py`
"""

def migrate_wrappers(repo_root):
    source_dir = os.path.join(repo_root, 'docs', 'wrappers_source')

    if not os.path.exists(source_dir):
        print(f"Source dir {source_dir} does not exist.")
        return

    files = [f for f in os.listdir(source_dir) if f.endswith('.md')]

    for filename in files:
        version = None
        if filename.startswith('v0.8'):
            version = 'v0.8'
        elif filename.startswith('v0.9'):
            version = 'v0.9'
        elif filename.startswith('v0.10'):
            version = 'v0.10'

        if not version:
            continue

        dest_dir = os.path.join(repo_root, 'docs', version, 'specification', 'docs')
        if not os.path.exists(dest_dir):
            os.makedirs(dest_dir, exist_ok=True)

        source_path = os.path.join(source_dir, filename)
        dest_path = os.path.join(dest_dir, filename)

        with open(source_path, 'r') as f:
            content = f.read()

        # Update include paths
        # Old: "docs/specification/v0_8/docs/..."
        # New: "docs/v0.8/specification/docs/..."
        # Note the underscore to dot change for versions in the path if needed
        # The snippet path needs to match where the file ACTUALLY is relative to mkdocs root (repo root usually)

        # Regex for includes
        # --8<-- "docs/specification/v0_([0-9]+)/
        # Replace with docs/v0.\1/specification/
        content = re.sub(r'docs/specification/v0_(\d+)/', r'docs/v0.\1/specification/', content)

        # Update links
        # We need to fix links to other versions.
        # Links usually look like: (v0.8-a2ui.md)

        def link_replacer(match):
            link_target = match.group(1) # e.g. v0.8-a2ui.md
            if link_target.startswith(version):
                return f"({link_target})" # Same version, same dir

            # Different version
            target_ver = link_target.split('-')[0] # v0.8
            return f"(../../../{target_ver}/specification/docs/{link_target})"

        content = re.sub(r'\((v0\.\d+-[^)]+\.md)\)', link_replacer, content)

        with open(dest_path, 'w') as f:
            f.write(content)

        print(f"Migrated {filename} into {dest_path}")
        # os.remove(source_path) # verify first


def main():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    migrate_wrappers(repo_root)


if __name__ == '__main__':
    main()
