#!/usr/bin/env python3
import os
import sys
import shutil
import subprocess
import json
from typing import Optional

# Colors for output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"

def print_status(message: str, status: str):
    color = GREEN if status == "OK" else RED if status == "FAIL" else YELLOW
    print(f"{message:.<60} [{color}{status}{RESET}]")

def check_command(command: str) -> bool:
    return shutil.which(command) is not None

def check_python_version() -> bool:
    version = sys.version_info
    is_valid = version.major == 3 and version.minor >= 9
    print_status(f"Python version ({version.major}.{version.minor}) >= 3.9", "OK" if is_valid else "FAIL")
    return is_valid

def check_tool(name: str) -> bool:
    exists = check_command(name)
    print_status(f"Tool installed: {name}", "OK" if exists else "FAIL")
    return exists

def check_auth() -> tuple[bool, str]:
    api_key = os.getenv("GEMINI_API_KEY")
    adc_creds = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    
    # Check for ADC default file if env var not set
    if not adc_creds:
        default_adc = os.path.expanduser("~/.config/gcloud/application_default_credentials.json")
        if os.path.exists(default_adc):
            adc_creds = default_adc

    if api_key:
        print_status("Auth: GEMINI_API_KEY found", "OK")
        return True, "api_key"
    elif adc_creds:
        print_status("Auth: Application Default Credentials found", "OK")
        return True, "adc"
    else:
        print_status("Auth: No credentials found (API Key or ADC)", "FAIL")
        return False, "none"

def verify_connectivity(auth_type: str) -> bool:
    print("\nVerifying connectivity with LLM...")
    
    # We use a simple inline script to test litellm connectivity
    # This avoids needing to install dependencies in the global environment
    # We assume 'uv' is installed and use it to run the test in an ephemeral venv
    
    test_script = """
import os
import sys
from litellm import completion

# Determine model based on available auth
model = "gemini-2.5-flash" # Default to Vertex (ADC)
if os.getenv("GEMINI_API_KEY"):
    model = "gemini/gemini-2.5-flash" # Use AI Studio if Key exists

try:
    print(f"Attempting completion with model: {model}")
    response = completion(
        model=model,
        messages=[{"role": "user", "content": "Hello, are you online?"}]
    )
    print("Successfully received response")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
"""
    
    try:
        # Run with uv to ensure litellm and google-auth are available
        result = subprocess.run(
            ["uv", "run", "--with", "litellm", "--with", "google-auth", "python", "-c", test_script],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print_status("LLM Connectivity (gemini-2.5-flash)", "OK")
            return True
        else:
            print_status("LLM Connectivity (gemini-2.5-flash)", "FAIL")
            print(f"{RED}Error details:{RESET}")
            print(result.stdout)
            print(result.stderr)
            return False
            
    except Exception as e:
        print_status("LLM Connectivity check failed to run", "FAIL")
        print(f"Exception: {e}")
        return False

def main():
    print(f"{GREEN}=== A2UI Onboarding Verification ==={RESET}\n")
    
    all_passed = True
    
    # 1. Check Tools
    if not check_python_version(): all_passed = False
    if not check_tool("uv"): all_passed = False
    if not check_tool("node"): 
        print(f"{YELLOW}Node.js not found. Required for web clients.{RESET}")
        # Not marking as failure for backend-only dev, but good to warn
    if not check_tool("npm"): 
        print(f"{YELLOW}npm not found. Required for web clients.{RESET}")
    
    # 2. Check Auth
    auth_ok, auth_type = check_auth()
    if not auth_ok: all_passed = False
    
    # 3. Check Connectivity (only if tools and auth are ok)
    if all_passed:
        if not verify_connectivity(auth_type):
            all_passed = False
    else:
        print(f"\n{YELLOW}Skipping connectivity check due to previous failures.{RESET}")

    print("\n" + "="*40)
    if all_passed:
        print(f"{GREEN}SUCCESS: Your environment is ready for A2UI development!{RESET}")
        sys.exit(0)
    else:
        print(f"{RED}FAILURE: Please fix the issues above.{RESET}")
        sys.exit(1)

if __name__ == "__main__":
    main()
