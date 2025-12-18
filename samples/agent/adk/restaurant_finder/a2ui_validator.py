import json
import os
from typing import List, Dict, Any
from jsonschema import validate, ValidationError

SCHEMA_FILE = "/Users/jsimionato/development/a2ui_repos/jewel_case/A2UI/specification/0.8/json/server_to_client_with_standard_catalog.json"

SCHEMAS = {}

def load_schemas():
    if SCHEMAS:
        return
    try:
        with open(SCHEMA_FILE, 'r') as f:
            main_schema = json.load(f)
            SCHEMAS.update(main_schema.get('properties', {}))
            if not SCHEMAS:
                raise ValueError("No properties found in main schema")
            # The actual component schemas are in the definitions, so let's add those too
            SCHEMAS.update(main_schema.get('$defs', {}))
    except FileNotFoundError:
        raise ValueError(f"Schema file not found at {SCHEMA_FILE}")
    except json.JSONDecodeError:
        raise ValueError(f"Failed to decode JSON from {SCHEMA_FILE}")

def get_schema(name: str):
    load_schemas()
    if name in SCHEMAS:
        return SCHEMAS[name]
    raise ValueError(f"Schema {name} not found in {SCHEMA_FILE}")

def validate_a2ui_messages(messages: List[Dict[str, Any]]):
    for i, msg in enumerate(messages):
        try:
            if "beginRendering" in msg:
                validate(instance=msg, schema=get_schema("beginRendering"))
            elif "surfaceUpdate" in msg:
                validate(instance=msg, schema=get_schema("surfaceUpdate"))
            elif "dataModelUpdate" in msg:
                validate(instance=msg, schema=get_schema("dataModelUpdate"))
            elif "deleteSurface" in msg:
                validate(instance=msg, schema=get_schema("deleteSurface"))
            else:
                raise ValidationError(f"Message {i} has no known A2UI message type key")
        except ValidationError as e:
            print(f"A2UI Validation Error in message {i} ({list(msg.keys())[0]}): {e.message}")
            raise
        except ValueError as e:
            print(f"Schema loading/lookup error: {e}")
            raise
