#!/usr/bin/env python3
import os
import shutil
import glob
try:
    from migrate_wrappers import migrate_wrappers
except ImportError:
    # Fallback for when running directly or in different contexts
    from docs.scripts.migrate_wrappers import migrate_wrappers

"""
Prepares the raw A2UI specification files for use in the MkDocs build.

This script performs the following tasks:
1.  **Copies Source Files**: Copies the raw specification files from the root `specification/` directory (e.g., `specification/v0_9`) into the versioned documentation structure (e.g., `docs/v0.9/specification`).
2.  **Flattens Directory Structure**: Moves JSON files from subdirectories (like `json/`) to the root of the versioned specification directory to simplify relative linking. It updates links in the Markdown files to reflect this change.
3.  **Rewrites Links**: Adjusts internal links within the specification files to work correctly in their new location within the documentation site. This handles cross-version linking and ensures that relative paths to assets or other docs are valid.

Usage:
    Run this script before `mkdocs build`.
    `python3 docs/scripts/prepare_docs.py`
"""

def prepare_docs(repo_root):
    """Prepares the documentation for the given repository root."""
    spec_source_root = os.path.join(repo_root, 'specification')

    print(f"Preparing documentation...")

    # Iterate over all directories in specification/
    if not os.path.exists(spec_source_root):
        print(f"Specification root {spec_source_root} does not exist.")
        return

    for item in os.listdir(spec_source_root):
        source_path = os.path.join(spec_source_root, item)
        if not os.path.isdir(source_path):
            continue

        # We assume directories in specification/ are versions (e.g. v0_8, v0_9)
        # Map source directory names to versioned document directories
        # v0_8 -> v0.8, v0_9 -> v0.9
        version_name = item.replace('_', '.')
        dest_path = os.path.join(repo_root, 'docs', version_name, 'specification')

        print(f"Processing {item}...")

        # Remove destination if it exists
        if os.path.exists(dest_path):
            shutil.rmtree(dest_path)

        # Copy the directory structure, ignoring specified patterns
        # We explicitly exclude 'eval' and 'test' directories.
        shutil.copytree(source_path, dest_path, ignore=shutil.ignore_patterns(
            'node_modules', '__pycache__', '.*', 'dist', 'build', 'eval', 'test'
        ))

        print(f"  Copied to {dest_path}")

        # Flatten JSON files: move json/*.json to the version root
        json_dir = os.path.join(dest_path, 'json')
        if os.path.exists(json_dir) and os.path.isdir(json_dir):
            json_files = glob.glob(os.path.join(json_dir, '*.json'))
            if json_files:
                print(f"  Moving {len(json_files)} JSON files to {dest_path}")
                for json_file in json_files:
                    shutil.move(json_file, dest_path)
                shutil.rmtree(json_dir)

        # Rewrite links in copied markdown files to work in the new context
        if item == 'v0_8':
            # Rewrite custom_catalog_changes.md
            ccc_path = os.path.join(dest_path, 'docs', 'custom_catalog_changes.md')
            if os.path.exists(ccc_path):
                with open(ccc_path, 'r') as f:
                    content = f.read()

                # Rewrites for custom_catalog_changes.md
                content = content.replace('(./a2ui_extension_specification.md)', '(v0.8-a2a-extension.md)')
                content = content.replace('(./a2ui_protocol.md', '(v0.8-a2ui.md') # Note the missing closing paren to match anchor links too
                content = content.replace('../json/', '../')
                content = content.replace('(../json/', '(../')

                with open(ccc_path, 'w') as f:
                    f.write(content)
                print(f"  Rewrote links in {ccc_path}")

            # Rewrite a2ui_protocol.md to point to the wrapper if it links to custom_catalog_changes.md
            protocol_path = os.path.join(dest_path, 'docs', 'a2ui_protocol.md')
            if os.path.exists(protocol_path):
                with open(protocol_path, 'r') as f:
                    content = f.read()

                content = content.replace('(custom_catalog_changes.md)', '(custom_catalog_changes.md)')
                content = content.replace('../json/', '../')

                with open(protocol_path, 'w') as f:
                    f.write(content)
                print(f"  Rewrote links in {protocol_path}")

        if item == 'v0_9':
            protocol_path = os.path.join(dest_path, 'docs', 'a2ui_protocol.md')
            if os.path.exists(protocol_path):
                with open(protocol_path, 'r') as f:
                    content = f.read()

                # Fix relative links that break when included from a parent directory
                # evolution_guide.md is in v0.9/docs/ relative to docs/specification/
                content = content.replace('(evolution_guide.md)', '(v0.9-evolution-guide.md)')
                # JSON files are flattened to the version root, so ../json/ becomes ../
                content = content.replace('../json/', '../')

                with open(protocol_path, 'w') as f:
                    f.write(content)
                print(f"  Rewrote links in {protocol_path}")

            # Rewrite a2ui_custom_functions.md
            cf_path = os.path.join(dest_path, 'docs', 'a2ui_custom_functions.md')
            if os.path.exists(cf_path):
                with open(cf_path, 'r') as f:
                    content = f.read()

                content = content.replace('(a2ui_protocol.md', '(v0.9-a2ui.md')
                content = content.replace('../json/', '../')

                with open(cf_path, 'w') as f:
                    f.write(content)
                print(f"  Rewrote links in {cf_path}")

        if item == 'v0_10':
            protocol_path = os.path.join(dest_path, 'docs', 'a2ui_protocol.md')
            if os.path.exists(protocol_path):
                with open(protocol_path, 'r') as f:
                    content = f.read()

                # Fix relative links that break when included from a parent directory
                # evolution_guide.md is in v0_10/docs/ relative to docs/specification/
                content = content.replace('(evolution_guide.md)', '(v0.10-evolution-guide.md)')
                # JSON files are flattened to the version root, so ../json/ becomes ../
                content = content.replace('../json/', '../')

                with open(protocol_path, 'w') as f:
                    f.write(content)
                print(f"  Rewrote links in {protocol_path}")

            # Rewrite a2ui_custom_functions.md
            cf_path = os.path.join(dest_path, 'docs', 'a2ui_custom_functions.md')
            if os.path.exists(cf_path):
                with open(cf_path, 'r') as f:
                    content = f.read()

                content = content.replace('(a2ui_protocol.md', '(v0.10-a2ui.md')
                content = content.replace('../json/', '../')

                with open(cf_path, 'w') as f:
                    f.write(content)
                print(f"  Rewrote links in {cf_path}")

    print(f"Successfully prepared documentation.")


def main():
    """Calculates the source and destination paths for the specification files."""
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    prepare_docs(repo_root)
    migrate_wrappers(repo_root)


if __name__ == '__main__':
    main()
