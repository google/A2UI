import json
import subprocess
import os
import glob
import sys

# Constants
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
SCHEMA_DIR = os.path.abspath(os.path.join(TEST_DIR, "../json"))
CASES_DIR = os.path.join(TEST_DIR, "cases")
TEMP_FILE = os.path.join(TEST_DIR, "temp_data.json")

# Map of schema filenames to their full paths
SCHEMAS = {
    "server_to_client.json": os.path.join(SCHEMA_DIR, "server_to_client.json"),
    "common_types.json": os.path.join(SCHEMA_DIR, "common_types.json"),
    "standard_catalog_definition.json": os.path.join(SCHEMA_DIR, "standard_catalog_definition.json"),
    "expression_types.json": os.path.join(SCHEMA_DIR, "expression_types.json"),
    "client_to_server.json": os.path.join(SCHEMA_DIR, "client_to_server.json"),
    "standard_function_catalog.json": os.path.join(SCHEMA_DIR, "standard_function_catalog.json"),
}

def validate_ajv(schema_path, data_path, all_schemas):
    """Runs ajv validate via subprocess."""
    cmd = ["ajv", "validate", "-s", schema_path, "--spec=draft2020", "--strict=false", "-d", data_path]

    # Add all other schemas as references
    for name, path in all_schemas.items():
        if path != schema_path:
            cmd.extend(["-r", path])

    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        return result.returncode == 0, result.stdout + result.stderr
    except FileNotFoundError:
        print("Error: 'ajv' command not found. Please install it (e.g., 'npm install -g ajv-cli').")
        sys.exit(1)

def run_suite(suite_path):
    with open(suite_path, 'r') as f:
        try:
            suite = json.load(f)
        except json.JSONDecodeError as e:
            print(f"Error parse JSON in {suite_path}: {e}")
            return 0, 0

    schema_name = suite.get("schema", "server_to_client.json")
    if schema_name not in SCHEMAS:
        print(f"Error: Unknown schema '{schema_name}' referenced in {suite_path}")
        return 0, 0

    schema_path = SCHEMAS[schema_name]
    tests = suite.get("tests", [])

    print(f"\nRunning suite: {os.path.basename(suite_path)} ({len(tests)} tests)")
    print(f"Target Schema: {schema_name}")

    passed = 0
    failed = 0

    for i, test in enumerate(tests):
        description = test.get("description", f"Test #{i+1}")
        expect_valid = test.get("valid", True)
        data = test.get("data")

        # Write data to temp file
        with open(TEMP_FILE, 'w') as f:
            json.dump(data, f)

        is_valid, output = validate_ajv(schema_path, TEMP_FILE, SCHEMAS)

        if is_valid == expect_valid:
            passed += 1
            # print(f"  [PASS] {description}")
        else:
            failed += 1
            print(f"  [FAIL] {description}")
            print(f"         Expected Valid: {expect_valid}, Got Valid: {is_valid}")
            if not is_valid:
                 print(f"         Output: {output.strip()}")

    return passed, failed

def main():
    if not os.path.exists(CASES_DIR):
        print(f"No cases directory found at {CASES_DIR}")
        return

    test_files = glob.glob(os.path.join(CASES_DIR, "*.json"))
    if not test_files:
        print("No test files found in cases directory.")
        return

    total_passed = 0
    total_failed = 0

    for test_file in sorted(test_files):
        p, f = run_suite(test_file)
        total_passed += p
        total_failed += f

    print("\n" + "="*30)
    print(f"Total Passed: {total_passed}")
    print(f"Total Failed: {total_failed}")

    if os.path.exists(TEMP_FILE):
        os.remove(TEMP_FILE)

    if total_failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
