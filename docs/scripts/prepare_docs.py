#!/usr/bin/env python3
import os
import shutil
import glob

def main():
    """Calculates the source and destination paths for the specification files."""
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    spec_source_root = os.path.join(repo_root, 'specification')
    docs_spec_root = os.path.join(repo_root, 'docs', 'specification')

    print(f"Preparing documentation...")

    # Iterate over all directories in specification/
    for item in os.listdir(spec_source_root):
        source_path = os.path.join(spec_source_root, item)
        if not os.path.isdir(source_path):
            continue

        # We assume directories in specification/ are versions (e.g. v0_8, v0_9)
        dest_path = os.path.join(docs_spec_root, item)

        print(f"Processing {item}...")

        # Remove destination if it exists
        if os.path.exists(dest_path):
            shutil.rmtree(dest_path)

        # Copy the directory structure, ignoring specified patterns
        # We explicitly exclude 'eval' and 'test' directories as requested.
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
                content = content.replace('(./a2ui_extension_specification.md)', '(v0.8-extension-spec.md)')
                content = content.replace('(./a2ui_protocol.md', '(v0.8-a2ui.md') # Note the missing closing paren to match anchor links too
                content = content.replace('../json/', 'v0_8/')
                content = content.replace('(../json/', '(v0_8/')

                with open(ccc_path, 'w') as f:
                    f.write(content)
                print(f"  Rewrote links in {ccc_path}")

            # Rewrite a2ui_protocol.md to point to the wrapper if it links to custom_catalog_changes.md
            protocol_path = os.path.join(dest_path, 'docs', 'a2ui_protocol.md')
            if os.path.exists(protocol_path):
                with open(protocol_path, 'r') as f:
                    content = f.read()

                content = content.replace('(custom_catalog_changes.md)', '(v0.8-custom-catalog-changes.md)')
                content = content.replace('../json/', 'v0_8/')

                with open(protocol_path, 'w') as f:
                    f.write(content)
                print(f"  Rewrote links in {protocol_path}")

        if item == 'v0_9':
            protocol_path = os.path.join(dest_path, 'docs', 'a2ui_protocol.md')
            if os.path.exists(protocol_path):
                with open(protocol_path, 'r') as f:
                    content = f.read()

                # Fix relative links that break when included from a parent directory
                # evolution_guide.md is in v0_9/docs/ relative to docs/specification/
                content = content.replace('(evolution_guide.md)', '(v0.9-evolution-guide.md)')
                # JSON files are flattened to v0_9/ relative to docs/specification/
                content = content.replace('../json/', 'v0_9/')

                with open(protocol_path, 'w') as f:
                    f.write(content)
                print(f"  Rewrote links in {protocol_path}")

            # Rewrite a2ui_custom_functions.md
            cf_path = os.path.join(dest_path, 'docs', 'a2ui_custom_functions.md')
            if os.path.exists(cf_path):
                with open(cf_path, 'r') as f:
                    content = f.read()

                content = content.replace('(a2ui_protocol.md', '(v0.9-a2ui.md')
                content = content.replace('../json/', 'v0_9/')

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
                # JSON files are flattened to v0_10/ relative to docs/specification/
                content = content.replace('../json/', 'v0_10/')

                with open(protocol_path, 'w') as f:
                    f.write(content)
                print(f"  Rewrote links in {protocol_path}")

            # Rewrite a2ui_custom_functions.md
            cf_path = os.path.join(dest_path, 'docs', 'a2ui_custom_functions.md')
            if os.path.exists(cf_path):
                with open(cf_path, 'r') as f:
                    content = f.read()

                content = content.replace('(a2ui_protocol.md', '(v0.10-a2ui.md')
                content = content.replace('../json/', 'v0_10/')

                with open(cf_path, 'w') as f:
                    f.write(content)
                print(f"  Rewrote links in {cf_path}")

    print(f"Successfully prepared documentation.")

if __name__ == '__main__':
    main()
