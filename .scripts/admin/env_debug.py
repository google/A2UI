#!/usr/bin/env python3
import os
import sys
import platform
import subprocess
import shutil
from datetime import datetime

# Output file
OUTPUT_FILE = "a2ui_env_debug.txt"

def get_command_version(command, args=["--version"]):
    if not shutil.which(command):
        return "Not installed"
    try:
        result = subprocess.run([command] + args, capture_output=True, text=True)
        return result.stdout.strip().split('\n')[0]
    except Exception as e:
        return f"Error getting version: {e}"

def mask_value(key, value):
    sensitive_keywords = ["KEY", "SECRET", "TOKEN", "PASSWORD", "CREDENTIALS"]
    if any(keyword in key.upper() for keyword in sensitive_keywords):
        if not value:
            return "Not Set"
        if len(value) > 8:
            return f"{value[:4]}...{value[-4:]} (Masked)"
        return "******** (Masked)"
    return value

def collect_info():
    info = []
    
    info.append("=== A2UI Environment Debug Report ===")
    info.append(f"Generated at: {datetime.now()}")
    info.append("")
    
    info.append("--- System Information ---")
    info.append(f"OS: {platform.system()} {platform.release()}")
    info.append(f"Platform: {platform.platform()}")
    info.append(f"Architecture: {platform.machine()}")
    info.append("")
    
    info.append("--- Python Environment ---")
    info.append(f"Python Executable: {sys.executable}")
    info.append(f"Python Version: {sys.version.split()[0]}")
    info.append("")
    
    info.append("--- Tools ---")
    info.append(f"uv: {get_command_version('uv')}")
    info.append(f"node: {get_command_version('node')}")
    info.append(f"npm: {get_command_version('npm')}")
    info.append(f"git: {get_command_version('git')}")
    info.append("")
    
    info.append("--- Environment Variables (Relevant & Masked) ---")
    relevant_prefixes = ["GEMINI", "GOOGLE", "A2UI", "PYTHON", "NODE"]
    
    env_vars = os.environ.copy()
    sorted_keys = sorted(env_vars.keys())
    
    for key in sorted_keys:
        if any(key.startswith(prefix) for prefix in relevant_prefixes) or "KEY" in key.upper():
            value = env_vars[key]
            masked_value = mask_value(key, value)
            info.append(f"{key}={masked_value}")
            
    return "\n".join(info)

def main():
    print("Collecting environment information...")
    report = collect_info()
    
    print("\n" + "="*40)
    print(report)
    print("="*40 + "\n")
    
    try:
        with open(OUTPUT_FILE, "w") as f:
            f.write(report)
        print(f"Report saved to: {os.path.abspath(OUTPUT_FILE)}")
    except Exception as e:
        print(f"Error saving report: {e}")

if __name__ == "__main__":
    main()
