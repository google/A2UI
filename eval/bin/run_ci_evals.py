#!/usr/bin/env python3
# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Run A2UI evals for CI and check pass percentage."""

import argparse
import datetime
import glob
import json
import os
import shutil
import subprocess
import sys

def extract_accuracy(log_data: dict) -> float:
    """Extracts accuracy from parsed JSON log data.

    Args:
        log_data: Parsed JSON data from inspect log dump.

    Returns:
        The accuracy score as a float.

    Raises:
        ValueError: If scores or accuracy are not found or invalid.
    """
    scores = log_data.get("results", {}).get("scores", [])
    if not scores:
        raise ValueError("No scores found in log file.")

    metrics = scores[0].get("metrics", {})
    accuracy_obj = metrics.get("accuracy") or {}
    accuracy = accuracy_obj.get("value")

    if accuracy is None:
        raise ValueError("Could not find accuracy metric in log file.")

    return float(accuracy)

def check_threshold(percentage: float, threshold: float) -> bool:
    """Compares percentage with threshold.

    Args:
        percentage: The calculated pass percentage.
        threshold: The threshold to compare against.

    Returns:
        True if percentage >= threshold, False otherwise.
    """
    return percentage >= threshold

def print_results_summary(log_data: dict):
    """Prints a summary of the results for each sample.

    Args:
        log_data: Parsed JSON data from inspect log dump.
    """
    samples = log_data.get("samples", [])
    print("\n=== Evaluation Results Summary ===")
    for sample in samples:
        name = sample.get("metadata", {}).get("name") or f"Sample {sample.get('id')}"
        scores = sample.get("scores", {})
        
        # Algorithmic validity (a2ui_scorer)
        a2ui_score = scores.get("a2ui_scorer", {})
        a2ui_passed = a2ui_score.get("value") == 1.0
        a2ui_str = "PASS" if a2ui_passed else "FAIL"
        
        # Judging results (measured_model_graded_qa)
        qa_score = scores.get("measured_model_graded_qa", {})
        qa_val = qa_score.get("value")
        
        print(f"{name}: Algorithmic: {a2ui_str} | Judging: {qa_val}")
        
        if not a2ui_passed or qa_val != "C":
            reason = ""
            if not a2ui_passed:
                reason += f"Algorithmic failed: {a2ui_score.get('explanation')}. "
            if qa_val != "C":
                reason += f"Judging failed (Grade {qa_val}): {qa_score.get('explanation')}."
            print(f"  Reason: {reason.strip()}")
    print("==================================")

def build_inspect_command(args: argparse.Namespace, seed: str) -> list[str]:
    """Builds the command line arguments for inspect eval.

    Args:
        args: Parsed command line arguments.
        seed: The random seed to use.

    Returns:
        A list of strings representing the command.
    """
    cmd = [
        "uv", "run", "inspect", "eval", "tasks.py",
        "--model", args.model,
        "--sample-shuffle", seed,
        "--display", "plain",
        "--log-dir", f"logs/{seed}",
        "--max-retries", "10",
        "-T", f"grading_model={args.grading_model}"
    ]
    if args.max_samples != 0:
        cmd.extend(["--limit", str(args.max_samples)])
    return cmd

def main():
    parser = argparse.ArgumentParser(description="Run A2UI evals for CI.")
    parser.add_argument("--max-samples", type=int, default=100, help="Maximum number of samples to evaluate. Set to 0 for all samples. Default is 100.")
    parser.add_argument("--threshold", type=float, default=0.0, help="Pass percentage threshold (0-100). Default is 0.0.")
    parser.add_argument("--model", type=str, default="google/gemini-3-flash-preview", help="Model used to evaluate tasks. Default is google/gemini-3-flash-preview.")
    parser.add_argument("--grading-model", type=str, default="google/gemini-3-flash-preview", help="Model used for grading. Default is google/gemini-3-flash-preview.")
    args = parser.parse_args()

    # Find eval root (directory above bin)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    eval_root = os.path.dirname(script_dir)

    os.chdir(eval_root)

    # Compute seed as YYYYMMDD
    seed = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d")
    print(f"Running evals with seed: {seed} and max samples: {args.max_samples}")

    # Create a dedicated log directory for this seed, clearing it if it exists
    log_dir = os.path.join(eval_root, "logs", seed)
    if os.path.exists(log_dir):
        shutil.rmtree(log_dir)
    os.makedirs(log_dir, exist_ok=True)

    # Run inspect eval
    # We use relative paths for tasks.py and log-dir to avoid NotImplementedError in inspect
    cmd = build_inspect_command(args, seed)

    print(f"Executing: {' '.join(cmd)}")

    # We don't use check=True because inspect might return non-zero on low scores
    result = subprocess.run(cmd, capture_output=False, text=True)

    # Find the generated log file in the dedicated directory
    log_files = glob.glob(os.path.join(log_dir, "*.eval"))
    if not log_files:
        print("Error: No log file generated by inspect eval.")
        sys.exit(result.returncode if result.returncode != 0 else 1)

    # Get the latest log file
    log_file = max(log_files, key=os.path.getmtime)
    print(f"Found log file: {log_file}")

    print(f"Determining pass percentage from log file: {log_file}")

    # Run inspect log dump to get JSON
    dump_cmd = ["uv", "run", "inspect", "log", "dump", log_file]
    try:
        dump_output = subprocess.check_output(dump_cmd, text=True)
        log_data = json.loads(dump_output)
        
        # Print summary of results per sample
        print_results_summary(log_data)
        
        try:
            accuracy = extract_accuracy(log_data)
            percentage = accuracy * 100
            print(f"Pass percentage: {percentage}%")

            if not check_threshold(percentage, args.threshold):
                print(f"Error: Pass percentage {percentage}% is less than threshold {args.threshold}%")
                sys.exit(1)

            print("Pass percentage check passed.")
            sys.exit(0)
        except ValueError as e:
            print(f"Error: {e}")
            sys.exit(1)

    except subprocess.CalledProcessError as e:
        print(f"Error running inspect log dump: {e}")
        sys.exit(e.returncode)
    except Exception as e:
        print(f"Error processing log file: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
