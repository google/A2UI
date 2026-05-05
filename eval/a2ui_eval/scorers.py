"""Scorers for A2UI evaluation."""

import json
import os
import re
from inspect_ai.scorer import scorer, Score, Target, accuracy
from inspect_ai.solver import TaskState
from jsonschema import ValidationError, Draft202012Validator
from referencing import Registry, Resource
from referencing.jsonschema import DRAFT202012

# Path to the schema file in the specification directory
SCHEMA_DIR = "/Users/gspencer/code/a2ui/evals/specification/v0_9/json"
S2C_SCHEMA_PATH = os.path.join(SCHEMA_DIR, "server_to_client.json")
CATALOG_SCHEMA_PATH = os.path.join(SCHEMA_DIR, "basic_catalog.json")
COMMON_TYPES_PATH = os.path.join(SCHEMA_DIR, "common_types.json")

def _strip_markdown_fences(text: str) -> str:
    """Strips leading and trailing markdown code blocks (e.g., ```json ... ```)."""
    text = text.strip()
    match = re.match(r"^```(?:json)?\s*(.*?)\s*```$", text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return text

def get_validator():
    if not os.path.exists(S2C_SCHEMA_PATH):
        raise FileNotFoundError(f"Schema file not found: {S2C_SCHEMA_PATH}")
        
    with open(S2C_SCHEMA_PATH, 'r', encoding='utf-8') as f:
        s2c_schema = json.load(f)
    with open(CATALOG_SCHEMA_PATH, 'r', encoding='utf-8') as f:
        catalog_schema = json.load(f)
    with open(COMMON_TYPES_PATH, 'r', encoding='utf-8') as f:
        common_types_schema = json.load(f)
        
    resources = [
        (
            "catalog.json",
            Resource.from_contents(catalog_schema, default_specification=DRAFT202012)
        ),
        (
            "common_types.json",
            Resource.from_contents(common_types_schema, default_specification=DRAFT202012)
        ),
        (
            "https://a2ui.org/specification/v0_9/catalog.json",
            Resource.from_contents(catalog_schema, default_specification=DRAFT202012)
        ),
        (
            "https://a2ui.org/specification/v0_9/common_types.json",
            Resource.from_contents(common_types_schema, default_specification=DRAFT202012)
        )
    ]
    
    registry = Registry().with_resources(resources)
    
    return Draft202012Validator(s2c_schema, registry=registry)

@scorer(metrics=[accuracy()])
def a2ui_schema_scorer():
    """Stage 1: Structural & Schema Validation."""
    validator = get_validator()
    
    async def score(state: TaskState, target: Target) -> Score:
        output = _strip_markdown_fences(state.output.completion)
        try:
            data = json.loads(output)
            validator.validate(instance=data)
            return Score(value=1.0, explanation="Valid schema")
        except json.JSONDecodeError:
            return Score(value=0.0, explanation="Invalid JSON")
        except ValidationError as e:
            return Score(value=0.0, explanation=f"Schema validation failed: {e.message}")
            
    return score

@scorer(metrics=[accuracy()])
def a2ui_semantic_scorer():
    """Stage 2: Programmatic Semantic Checks."""
    async def score(state: TaskState, target: Target) -> Score:
        output = _strip_markdown_fences(state.output.completion)
        try:
            data = json.loads(output)
        except json.JSONDecodeError:
            return Score(value=0.0, explanation="Invalid JSON (cannot perform semantic checks)")

        messages = []
        if isinstance(data, list):
            messages = data
        elif isinstance(data, dict):
            messages = [data]
            
        for msg in messages:
            if 'updateComponents' in msg:
                update_comps = msg['updateComponents']
                components = update_comps.get('components', [])
                
                # 1. Root Existence
                has_root = any(c.get('id') == 'root' for c in components)
                if not has_root:
                    return Score(value=0.0, explanation="Semantic check failed: No component with id 'root' found.")
                    
                # 2. Unique IDs
                ids = [c.get('id') for c in components if c.get('id') is not None]
                if len(ids) != len(set(ids)):
                    return Score(value=0.0, explanation="Semantic check failed: Duplicate component IDs found.")
                    
                # 3. Relationship Integrity
                id_map = {c.get('id'): c for c in components if c.get('id') is not None}
                for c in components:
                    children = c.get('children')
                    if isinstance(children, list):
                        for child_id in children:
                            if isinstance(child_id, str) and child_id not in id_map:
                                return Score(value=0.0, explanation=f"Semantic check failed: Referenced child ID '{child_id}' not found.")
                                
                # 4. Cycle Detection
                adj = {}
                for cid, c in id_map.items():
                    children = c.get('children')
                    if isinstance(children, list):
                        adj[cid] = [child for child in children if isinstance(child, str)]
                    else:
                        adj[cid] = []
                        
                visited = set()
                rec_stack = set()
                
                def is_cyclic(v):
                    visited.add(v)
                    rec_stack.add(v)
                    for neighbour in adj.get(v, []):
                        if neighbour not in visited:
                            if is_cyclic(neighbour):
                                return True
                        elif neighbour in rec_stack:
                            return True
                    rec_stack.remove(v)
                    return False
                    
                for node in adj:
                    if node not in visited:
                        if is_cyclic(node):
                            return Score(value=0.0, explanation="Semantic check failed: Circular reference detected in component tree.")

        return Score(value=1.0, explanation="Semantic checks passed")
        
    return score
