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

def extract_json_from_markdown(text: str) -> list:
    """Extracts JSON objects from markdown code blocks, supporting JSONL."""
    text = text.strip()
    # Find all ```json ... ``` blocks
    matches = re.findall(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL)
    
    results = []
    for content in matches:
        content = content.strip()
        try:
            results.append(json.loads(content))
        except json.JSONDecodeError:
            lines = content.split('\n')
            for line in lines:
                line = line.strip()
                if line:
                    try:
                        results.append(json.loads(line))
                    except json.JSONDecodeError:
                        pass
                        
    if not results:
        try:
            results.append(json.loads(text))
        except json.JSONDecodeError:
            lines = text.split('\n')
            for line in lines:
                line = line.strip()
                if line:
                    try:
                        results.append(json.loads(line))
                    except json.JSONDecodeError:
                        pass
                        
    return results

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
        ),
        (
            "https://a2ui.org/specification/v0_9/server_to_client.json",
            Resource.from_contents(s2c_schema, default_specification=DRAFT202012)
        )
    ]
    
    registry = Registry().with_resources(resources)
    
    return Draft202012Validator(s2c_schema, registry=registry)

@scorer(metrics=[accuracy()])
def a2ui_schema_scorer():
    """Stage 1: Structural & Schema Validation."""
    validator = get_validator()
    
    async def score(state: TaskState, target: Target) -> Score:
        messages = extract_json_from_markdown(state.output.completion)
        if not messages:
            return Score(value=0.0, explanation="Invalid JSON or no JSON found")
            
        errors = []
        schema_uri = "https://a2ui.org/specification/v0_9/server_to_client.json"
        
        for idx, message in enumerate(messages):
            sub_schema_name = None
            if "createSurface" in message:
                sub_schema_name = "CreateSurfaceMessage"
            elif "updateComponents" in message:
                sub_schema_name = "UpdateComponentsMessage"
            elif "updateDataModel" in message:
                sub_schema_name = "UpdateDataModelMessage"
            elif "deleteSurface" in message:
                sub_schema_name = "DeleteSurfaceMessage"
            else:
                errors.append(f"messages[{idx}]: Unknown message type")
                continue
                
            ref_schema = {"$ref": f"{schema_uri}#/$defs/{sub_schema_name}"}
            sub_validator = Draft202012Validator(ref_schema, registry=validator._registry)
            
            try:
                sub_validator.validate(message)
            except ValidationError as e:
                errors.append(f"messages[{idx}]: {e.message}")
                
            # Targeted Component Validation
            if sub_schema_name == "UpdateComponentsMessage":
                components = message.get("updateComponents", {}).get("components", [])
                for c_idx, comp in enumerate(components):
                    comp_type = comp.get("component")
                    if comp_type:
                        comp_ref_schema = {"$ref": f"catalog.json#/components/{comp_type}"}
                        comp_validator = Draft202012Validator(comp_ref_schema, registry=validator._registry)
                        try:
                            comp_validator.validate(comp)
                        except ValidationError as e:
                            comp_id = comp.get('id', f"index {c_idx}")
                            errors.append(f"messages[{idx}].updateComponents.components[{comp_id}]: {e.message}")
                            
        if errors:
            explanation = "Schema validation failed:\n" + "\n".join(errors)
            return Score(value=0.0, explanation=explanation)
            
        return Score(value=1.0, explanation="Valid schema")
            
    return score

@scorer(metrics=[accuracy()])
def a2ui_semantic_scorer():
    """Stage 2: Programmatic Semantic Checks."""
    async def score(state: TaskState, target: Target) -> Score:
        messages = extract_json_from_markdown(state.output.completion)
        if not messages:
            return Score(value=0.0, explanation="Invalid JSON or no JSON found (cannot perform semantic checks)")
            
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
