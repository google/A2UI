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

"""Scorers for A2UI evaluation."""

import json
import os
from inspect_ai.scorer import scorer, Score, Target, accuracy
from inspect_ai.solver import TaskState
from a2ui.schema.manager import A2uiSchemaManager
from a2ui.schema.catalog import CatalogConfig
from a2ui.parser.parser import parse_response

@scorer(metrics=[accuracy()])
def a2ui_scorer(catalog_path: str):
    """Scorer for A2UI evaluation using the Python SDK.

    Args:
        catalog_path: Path to the component catalog file used for validation.

    Returns:
        An Inspect Scorer that validates the response against the schema and integrity rules.
    """
    
    catalog_config = CatalogConfig.from_path("basic_catalog", catalog_path)
    manager = A2uiSchemaManager(version="0.9", catalogs=[catalog_config])
    catalog = manager.get_selected_catalog()
    validator = catalog.validator

    async def score(state: TaskState, target: Target) -> Score:  # pylint: disable=unused-argument
        try:
            parts = parse_response(state.output.completion)
            all_messages = []
            for part in parts:
                if part.a2ui_json:
                    if isinstance(part.a2ui_json, list):
                        all_messages.extend(part.a2ui_json)
                    else:
                        all_messages.append(part.a2ui_json)
                        
            if not all_messages:
                return Score(value=0.0, explanation="No A2UI JSON found in response (tags missing or empty)")
                
            validator.validate(all_messages)
            return Score(value=1.0, explanation="Valid A2UI payload")
        except Exception as e:
            return Score(value=0.0, explanation=str(e))
            
    return score
