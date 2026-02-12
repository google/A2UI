
import pytest
import jsonschema
from a2ui.extension.validation import validate_a2ui_json

# Simple schema for testing
SCHEMA = {
    "type": "object",
    "$defs": {
        "ComponentId": {"type": "string"},
        "ChildList": {
            "type": "array",
            "items": {"$ref": "#/$defs/ComponentId"}
        }
    },
    "properties": {
        "components": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"$ref": "#/$defs/ComponentId"},
                    "componentProperties": {
                        "type": "object",
                        "properties": {
                            "Column": {
                                "type": "object",
                                "properties": {
                                    "children": {"$ref": "#/$defs/ChildList"}
                                }
                            },
                             "Row": {
                                "type": "object",
                                "properties": {
                                    "children": {"$ref": "#/$defs/ChildList"}
                                }
                            },
                            "Container": {
                                "type": "object",
                                "properties": {
                                    "children": {"$ref": "#/$defs/ChildList"}
                                }
                            },
                            "Card": {
                                "type": "object",
                                "properties": {
                                    "child": {"$ref": "#/$defs/ComponentId"}
                                }
                            },
                            "Button": {
                                "type": "object",
                                "properties": {
                                    "child": {"$ref": "#/$defs/ComponentId"},
                                    "action": {
                                        # Minimal action schema for recursion tests
                                        "properties": {
                                            "functionCall": {
                                                "properties": {
                                                    "call": {"type": "string"},
                                                    "args": {"type": "object"}
                                                }
                                            }
                                        }
                                    } 
                                }
                            },
                             "Text": {
                                "type": "object",
                                "properties": {
                                    "text": {
                                        "oneOf": [
                                            {"type": "string"},
                                            {"type": "object"} 
                                        ]
                                    }
                                }
                            }
                        }
                    }
                },
                "required": ["id"]
            }
        }
    }
}

def test_validate_a2ui_json_valid_integrity():
    payload = {
        "components": [
            {
                "id": "root",
                "componentProperties": {
                     "Column": {
                         "children": ["child1"]
                     }
                }
            },
            {
                "id": "child1",
                "componentProperties": {
                    "Text": {
                        "text": "Hello"
                    }
                }
            }
        ]
    }
    # Should not raise
    validate_a2ui_json(payload, SCHEMA)

def test_validate_a2ui_json_duplicate_ids():
    payload = {
        "components": [
            {"id": "root", "componentProperties": {}},
            {"id": "root", "componentProperties": {}}
        ]
    }
    with pytest.raises(ValueError, match="Duplicate component ID found: 'root'"):
        validate_a2ui_json(payload, SCHEMA)

def test_validate_a2ui_json_missing_root():
    payload = {
        "components": [
            {"id": "not-root", "componentProperties": {}}
        ]
    }
    with pytest.raises(ValueError, match="Missing 'root' component"):
        validate_a2ui_json(payload, SCHEMA)

def test_validate_a2ui_json_dangling_reference_child():
    payload = {
        "components": [
            {
                "id": "root", 
                "componentProperties": {
                    "Card": {
                        "child": "missing_child"
                    }
                }
            }
        ]
    }
    with pytest.raises(ValueError, match="Component 'root' references missing ID 'missing_child' in field 'child'"):
        validate_a2ui_json(payload, SCHEMA)

def test_validate_a2ui_json_dangling_reference_children():
    payload = {
        "components": [
            {
                "id": "root", 
                "componentProperties": {
                    "Column": {
                        "children": ["child1", "missing_child"]
                    }
                }
            },
            {"id": "child1", "componentProperties": {}}
        ]
    }
    with pytest.raises(ValueError, match="Component 'root' references missing ID 'missing_child' in field 'children'"):
        validate_a2ui_json(payload, SCHEMA)


def test_validate_a2ui_json_self_reference():
    payload = {
        "components": [
            {
                "id": "root", 
                "componentProperties": {
                    "Container": {
                        "children": ["root"]
                    }
                }
            }
        ]
    }
    with pytest.raises(ValueError, match="Self-reference detected: Component 'root' references itself in field 'children'"):
        validate_a2ui_json(payload, SCHEMA)

def test_validate_a2ui_json_circular_reference():
    payload = {
        "components": [
            {
                "id": "root", 
                "componentProperties": {
                    "Container": {
                        "children": ["child1"]
                    }
                }
            },
            {
                "id": "child1",
                "componentProperties": {
                    "Container": {
                         "children": ["root"]
                    }
                }
            }
        ]
    }
    with pytest.raises(ValueError, match="Circular reference detected involving component"):
        # The exact message depends on DFS order, but it should contain "Circular reference detected involving component"
        validate_a2ui_json(payload, SCHEMA)

def test_validate_a2ui_json_orphaned_component():
    payload = {
        "components": [
            {
                "id": "root", 
                "componentProperties": {
                    "Container": {
                        "children": []
                    }
                }
            },
            {
                "id": "orphan", 
                "componentProperties": {}
            }
        ]
    }
    # We use regex match because the list order in set conversion might vary, though I sorted it in code.
    # But to be safe on Python versions or whatever...
    # I sorted it in code: sorted(list(orphans))
    with pytest.raises(ValueError, match=r"Orphaned components detected \(not reachable from 'root'\): \['orphan'\]"):
        validate_a2ui_json(payload, SCHEMA)

def test_validate_a2ui_json_valid_topology_complex():
    """Test a valid topology with multiple levels."""
    payload = {
        "components": [
            {
                "id": "root", 
                "componentProperties": {
                    "Container": {
                        "children": ["child1", "child2"]
                    }
                }
            },
            {
                "id": "child1", 
                "componentProperties": {
                    "Text": {"text": "Hello"}
                }
            },
            {
                "id": "child2",
                "componentProperties": {
                    "Container": {
                        "children": ["child3"]
                    }
                }
            },
            {
                "id": "child3",
                "componentProperties": {
                    "Text": {"text": "World"}
                }
            }
        ]
    }
    # Should not raise
    validate_a2ui_json(payload, SCHEMA)

def test_validate_recursion_limit_exceeded():
    """Test that recursion depth > 5 raises ValueError."""
    # Nesting level 6
    payload = {
        "components": [
            {
                "id": "root",
                "componentProperties": {
                    "Button": {
                        "label": "Click me",
                        "action": {
                            "functionCall": {
                                "call": "fn1",
                                "args": {
                                    "arg1": {
                                        # Depth 2
                                        "call": "fn2",
                                        "args": {
                                            "arg2": {
                                                # Depth 3
                                                "call": "fn3",
                                                "args": {
                                                    "arg3": {
                                                        # Depth 4
                                                        "call": "fn4",
                                                        "args": {
                                                            "arg4": {
                                                                # Depth 5
                                                                "call": "fn5",
                                                                "args": {
                                                                    "arg5": {
                                                                        # Depth 6 - Should fail
                                                                        "call": "fn6",
                                                                        "args": {}
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        ]
    }
    with pytest.raises(ValueError, match="Recursion limit exceeded"):
        validate_a2ui_json(payload, SCHEMA)

def test_validate_recursion_limit_valid():
    """Test that recursion depth <= 5 is allowed."""
    # Nesting level 5
    payload = {
        "components": [
            {
                "id": "root",
                "componentProperties": {
                    "Button": {
                        "label": "Click me",
                        "action": {
                            "functionCall": {
                                "call": "fn1",
                                "args": {
                                    "arg1": {
                                        "call": "fn2",
                                        "args": {
                                            "arg2": {
                                                "call": "fn3",
                                                "args": {
                                                    "arg3": {
                                                        "call": "fn4",
                                                        "args": {
                                                            "arg4": {
                                                                "call": "fn5",
                                                                "args": {}
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        ]
    }
    # Should not raise
    validate_a2ui_json(payload, SCHEMA)

def test_validate_invalid_datamodel_path_update():
    """Test invalid path in UpdateDataModelMessage."""
    payload = {
        "updateDataModel": {
            "surfaceId": "surface1",
            "path": "invalid//path",
            "value": "data"
        }
    }
    with pytest.raises(ValueError, match="Invalid data model path"):
        validate_a2ui_json(payload, SCHEMA)

def test_validate_invalid_databinding_path():
    """Test invalid path in DataBinding."""
    payload = {
        "components": [
            {
                "id": "root",
                "componentProperties": {
                    "Text": {
                        "text": {
                            "path": "invalid path with spaces"
                        }
                    }
                }
            }
        ]
    }
    with pytest.raises(ValueError, match="Invalid data model path"):
        validate_a2ui_json(payload, SCHEMA)

def test_validate_global_recursion_limit_exceeded():
    """Test that global recursion depth > 50 raises ValueError."""
    # Create a deeply nested dictionary
    deep_payload = {"level": 0}
    current = deep_payload
    for i in range(55):
        current["next"] = {"level": i + 1}
        current = current["next"]
    
    with pytest.raises(ValueError, match="Global recursion limit exceeded"):
        validate_a2ui_json(deep_payload, SCHEMA)


def test_validate_custom_schema_reference():
    """Test validation with a custom schema where a component has a non-standard reference field."""
    # Custom schema extending the base one
    custom_schema = {
        "type": "object",
        "$defs": {
            "ComponentId": {"type": "string"},
            "ChildList": {
                "type": "array",
                "items": {"$ref": "#/$defs/ComponentId"}
            }
        },
        "properties": {
            "components": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {"$ref": "#/$defs/ComponentId"},
                        "componentProperties": {
                            "type": "object",
                            "properties": {
                                "CustomLink": {
                                    "type": "object",
                                    "properties": {
                                        # "linkedComponentId" should be picked up because it refs ComponentId
                                        "linkedComponentId": {"$ref": "#/$defs/ComponentId"}
                                    }
                                }
                            }
                        }
                    },
                    "required": ["id"]
                }
            }
        }
    }

    payload = {
        "components": [
            {
                "id": "root", 
                "componentProperties": {
                    "CustomLink": {
                        "linkedComponentId": "missing_target"
                    }
                }
            }
        ]
    }
    
    # Validation should fail because "linkedComponentId" references "missing_target"
    # and the logic should have extracted "linkedComponentId" as a reference field from the schema.
    with pytest.raises(ValueError, match="Component 'root' references missing ID 'missing_target' in field 'linkedComponentId'"):
        validate_a2ui_json(payload, custom_schema)
