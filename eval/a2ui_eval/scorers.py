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
    """Scorer for A2UI evaluation using the Python SDK."""
    
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
