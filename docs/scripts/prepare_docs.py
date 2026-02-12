#!/usr/bin/env python3
import os
import shutil
import glob

def main():
    """Calculates the source and destination paths for the specification files."""
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    spec_source = os.path.join(repo_root, 'specification', 'v0_9')
    docs_spec_dest = os.path.join(repo_root, 'docs', 'specification', 'v0_9')

    print(f"Preparing documentation...")
    print(f"Copying specification files from {spec_source} to {docs_spec_dest}")

    try:
        if os.path.exists(docs_spec_dest):
            shutil.rmtree(docs_spec_dest)

        # Copy the entire directory structure, ignoring node_modules and other build artifacts
        shutil.copytree(spec_source, docs_spec_dest, ignore=shutil.ignore_patterns('node_modules', '__pycache__', '.*', 'dist', 'build'))

        print(f"Successfully copied specification files to {docs_spec_dest}")

    except Exception as e:
        print(f"Error copying files: {e}")
        exit(1)

if __name__ == '__main__':
    main()
