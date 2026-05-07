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

"""Unit tests for run_ci_evals.py."""

import os
import sys
import pytest

# Add bin directory to path to import run_ci_evals
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../bin')))
from run_ci_evals import extract_accuracy, check_threshold

def test_extract_accuracy_valid():
    log_data = {
        "results": {
            "scores": [
                {
                    "metrics": {
                        "accuracy": {
                            "value": 0.85
                        }
                    }
                }
            ]
        }
    }
    assert extract_accuracy(log_data) == 0.85

def test_extract_accuracy_no_scores():
    log_data = {"results": {}}
    with pytest.raises(ValueError, match="No scores found"):
        extract_accuracy(log_data)

def test_extract_accuracy_no_accuracy():
    log_data = {
        "results": {
            "scores": [
                {
                    "metrics": {}
                }
            ]
        }
    }
    with pytest.raises(ValueError, match="Could not find accuracy"):
        extract_accuracy(log_data)

def test_check_threshold_pass():
    assert check_threshold(85.0, 80.0) is True
    assert check_threshold(80.0, 80.0) is True

def test_check_threshold_fail():
    assert check_threshold(75.0, 80.0) is False
