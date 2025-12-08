#!/usr/bin/env python3
import os
import sys
from pathlib import Path

# Define sample directories
REPO_ROOT = Path(__file__).resolve().parents[2]
PYTHON_SAMPLES_DIR = REPO_ROOT / "a2a_agents/python/adk/samples"
WEB_SAMPLES_DIR = REPO_ROOT / "samples/client"

def check_python_samples():
    print(f"Checking Python samples in {PYTHON_SAMPLES_DIR}...")
    if not PYTHON_SAMPLES_DIR.exists():
        print(f"ERROR: Directory not found: {PYTHON_SAMPLES_DIR}")
        return False

    all_passed = True
    # Iterate over directories, ignoring __pycache__ and hidden files
    for sample_dir in PYTHON_SAMPLES_DIR.iterdir():
        if sample_dir.is_dir() and not sample_dir.name.startswith("__") and not sample_dir.name.startswith("."):
            has_main = (sample_dir / "__main__.py").exists() or (sample_dir / "main.py").exists()
            if has_main:
                print(f"  [OK] {sample_dir.name}")
            else:
                print(f"  [FAIL] {sample_dir.name} (Missing __main__.py or main.py)")
                all_passed = False
    return all_passed

def check_web_samples():
    print(f"\nChecking Web samples in {WEB_SAMPLES_DIR}...")
    if not WEB_SAMPLES_DIR.exists():
        print(f"ERROR: Directory not found: {WEB_SAMPLES_DIR}")
        return False

    all_passed = True
    for sample_dir in WEB_SAMPLES_DIR.iterdir():
        if sample_dir.is_dir() and not sample_dir.name.startswith("__") and not sample_dir.name.startswith("."):
            has_package_json = (sample_dir / "package.json").exists()
            if has_package_json:
                print(f"  [OK] {sample_dir.name}")
            else:
                print(f"  [FAIL] {sample_dir.name} (Missing package.json)")
                all_passed = False
    return all_passed

def main():
    print("=== A2UI Samples Verification ===\n")
    
    python_passed = check_python_samples()
    web_passed = check_web_samples()
    
    print("\n" + "="*40)
    if python_passed and web_passed:
        print("SUCCESS: All samples verified.")
        sys.exit(0)
    else:
        print("FAILURE: Some samples are missing required files.")
        sys.exit(1)

if __name__ == "__main__":
    main()
