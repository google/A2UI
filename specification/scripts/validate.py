#!/usr/bin/env python3

import os
import json
import subprocess
import glob
import sys
import shutil

def run_ajv(schema_path, data_path, refs=None):
    """Runs ajv validate via subprocess using pnpm dlx."""
    cmd = ["pnpm", "dlx", "ajv-cli", "validate", "-s", schema_path, "--spec=draft2020", "--strict=false", "-c", "ajv-formats", "-d", data_path]
    if refs:
        for ref in refs:
            cmd.extend(["-r", ref])
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.returncode == 0, result.stdout + result.stderr

def validate_messages(root_schema, example_files, refs=None, temp_dir="temp_val"):
    """Validates a list of JSON files where each file contains a list of messages."""
    os.makedirs(temp_dir, exist_ok=True)
    success = True
    
    for example_file in sorted(example_files):
        print(f"  Validating {os.path.basename(example_file)}...")
        with open(example_file, 'r') as f:
            try:
                messages = json.load(f)
            except json.JSONDecodeError as e:
                print(f"    [FAIL] Invalid JSON: {e}")
                success = False
                continue
        
        if not isinstance(messages, list):
             # Try single object
             messages = [messages]

        file_ok = True
        for i, msg in enumerate(messages):
            temp_data_path = os.path.join(temp_dir, f"msg_{os.path.basename(example_file)}_{i}.json")
            with open(temp_data_path, 'w') as f:
                json.dump(msg, f)
            
            is_valid, output = run_ajv(root_schema, temp_data_path, refs)
            if not is_valid:
                print(f"    [FAIL] Message #{i+1} failed validation:")
                print(output.strip())
                file_ok = False
                success = False
        
        if file_ok:
            print(f"    [PASS]")

    shutil.rmtree(temp_dir)
    return success

def main():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
    spec_root = os.path.join(repo_root, "specification")
    
    overall_success = True
    
    # Configuration for versions
    configs = {
        "v0_8": {
            "root_schema": "specification/v0_8/json/server_to_client_with_standard_catalog.json",
            "refs": [],
            "examples": "specification/v0_8/json/catalogs/basic/examples/*.json"
        },
        "v0_9": {
            "root_schema": "specification/v0_9/json/server_to_client.json",
            "refs": [
                "specification/v0_9/json/common_types.json",
                "specification/v0_9/json/basic_catalog.json" # Will be aliased below
            ],
            "examples": "specification/v0_9/json/catalogs/basic/examples/*.json"
        }
    }
    
    for version, config in configs.items():
        print(f"\n=== Validating {version} ===")
        
        version_temp_dir = os.path.join(repo_root, f"temp_val_{version}")
        os.makedirs(version_temp_dir, exist_ok=True)
        
        root_schema = os.path.join(repo_root, config["root_schema"])
        if not os.path.exists(root_schema):
            print(f"Error: Root schema not found at {root_schema}")
            overall_success = False
            continue
            
        refs = []
        for ref in config["refs"]:
            ref_path = os.path.join(repo_root, ref)
            if "basic_catalog.json" in ref:
                # v0.9 basic_catalog needs aliasing to catalog.json as expected by server_to_client.json
                with open(ref_path, 'r') as f:
                    catalog = json.load(f)
                if "$id" in catalog:
                    catalog["$id"] = catalog["$id"].replace("basic_catalog.json", "catalog.json")
                alias_path = os.path.join(version_temp_dir, "catalog.json")
                with open(alias_path, 'w') as f:
                    json.dump(catalog, f)
                refs.append(alias_path)
            else:
                refs.append(ref_path)
        
        example_pattern = os.path.join(repo_root, config["examples"])
        example_files = glob.glob(example_pattern)
        
        if not example_files:
            print(f"No examples found for {version} matching {example_pattern}")
        else:
            if not validate_messages(root_schema, example_files, refs, version_temp_dir):
                overall_success = False

        if os.path.exists(version_temp_dir):
            shutil.rmtree(version_temp_dir)

    if not overall_success:
        print("\nOverall Validation: FAILED")
        sys.exit(1)
    else:
        print("\nOverall Validation: PASSED")

if __name__ == "__main__":
    main()
