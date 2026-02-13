import pytest
import jsonschema
from a2ui.extension.validation import validate_a2ui_json


# Fixture for the schema
@pytest.fixture
def schema():
  return {
      "type": "object",
      "$defs": {
          "ComponentId": {"type": "string"},
          "ChildList": {"type": "array", "items": {"$ref": "#/$defs/ComponentId"}},
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
                                  },
                              },
                              "Row": {
                                  "type": "object",
                                  "properties": {
                                      "children": {"$ref": "#/$defs/ChildList"}
                                  },
                              },
                              "Container": {
                                  "type": "object",
                                  "properties": {
                                      "children": {"$ref": "#/$defs/ChildList"}
                                  },
                              },
                              "Card": {
                                  "type": "object",
                                  "properties": {
                                      "child": {"$ref": "#/$defs/ComponentId"}
                                  },
                              },
                              "Button": {
                                  "type": "object",
                                  "properties": {
                                      "child": {"$ref": "#/$defs/ComponentId"},
                                      "action": {
                                          "properties": {
                                              "functionCall": {
                                                  "properties": {
                                                      "call": {"type": "string"},
                                                      "args": {"type": "object"},
                                                  }
                                              }
                                          }
                                      },
                                  },
                              },
                              "Text": {
                                  "type": "object",
                                  "properties": {
                                      "text": {
                                          "oneOf": [
                                              {"type": "string"},
                                              {"type": "object"},
                                          ]
                                      }
                                  },
                              },
                          },
                      },
                  },
                  "required": ["id"],
              },
          }
      },
  }


def test_validate_a2ui_json_valid_integrity(schema):
  payload = {
      "components": [
          {"id": "root", "componentProperties": {"Column": {"children": ["child1"]}}},
          {"id": "child1", "componentProperties": {"Text": {"text": "Hello"}}},
      ]
  }
  validate_a2ui_json(payload, schema)


def test_validate_a2ui_json_duplicate_ids(schema):
  payload = {
      "components": [
          {"id": "root", "componentProperties": {}},
          {"id": "root", "componentProperties": {}},
      ]
  }
  with pytest.raises(ValueError, match="Duplicate component ID found: 'root'"):
    validate_a2ui_json(payload, schema)


def test_validate_a2ui_json_missing_root(schema):
  payload = {"components": [{"id": "not-root", "componentProperties": {}}]}
  with pytest.raises(ValueError, match="Missing 'root' component"):
    validate_a2ui_json(payload, schema)


@pytest.mark.parametrize(
    "component_type, field_name, ids_to_ref",
    [
        ("Card", "child", "missing_child"),
        ("Column", "children", ["child1", "missing_child"]),
    ],
)
def test_validate_a2ui_json_dangling_references(
    schema, component_type, field_name, ids_to_ref
):
  """Test dangling references for both single and list fields."""
  # Construct payload dynamically
  props = {field_name: ids_to_ref}
  payload = {
      "components": [{"id": "root", "componentProperties": {component_type: props}}]
  }
  if isinstance(ids_to_ref, list):
    # Add valid children if any
    for child_id in ids_to_ref:
      if child_id != "missing_child":
        payload["components"].append({"id": child_id, "componentProperties": {}})

  with pytest.raises(
      ValueError,
      match=(
          "Component 'root' references missing ID 'missing_child' in field"
          f" '{field_name}'"
      ),
  ):
    validate_a2ui_json(payload, schema)


def test_validate_a2ui_json_self_reference(schema):
  payload = {
      "components": [
          {"id": "root", "componentProperties": {"Container": {"children": ["root"]}}}
      ]
  }
  with pytest.raises(
      ValueError,
      match=(
          "Self-reference detected: Component 'root' references itself in field"
          " 'children'"
      ),
  ):
    validate_a2ui_json(payload, schema)


def test_validate_a2ui_json_circular_reference(schema):
  payload = {
      "components": [
          {
              "id": "root",
              "componentProperties": {"Container": {"children": ["child1"]}},
          },
          {
              "id": "child1",
              "componentProperties": {"Container": {"children": ["root"]}},
          },
      ]
  }
  with pytest.raises(
      ValueError, match="Circular reference detected involving component"
  ):
    validate_a2ui_json(payload, schema)


def test_validate_a2ui_json_orphaned_component(schema):
  payload = {
      "components": [
          {"id": "root", "componentProperties": {"Container": {"children": []}}},
          {"id": "orphan", "componentProperties": {}},
      ]
  }
  with pytest.raises(
      ValueError,
      match=r"Orphaned components detected \(not reachable from 'root'\): \['orphan'\]",
  ):
    validate_a2ui_json(payload, schema)


def test_validate_a2ui_json_valid_topology_complex(schema):
  """Test a valid topology with multiple levels."""
  payload = {
      "components": [
          {
              "id": "root",
              "componentProperties": {"Container": {"children": ["child1", "child2"]}},
          },
          {"id": "child1", "componentProperties": {"Text": {"text": "Hello"}}},
          {
              "id": "child2",
              "componentProperties": {"Container": {"children": ["child3"]}},
          },
          {"id": "child3", "componentProperties": {"Text": {"text": "World"}}},
      ]
  }
  validate_a2ui_json(payload, schema)


def test_validate_recursion_limit_exceeded(schema):
  """Test that recursion depth > 5 raises ValueError."""
  # Construct deep function call
  args = {}
  current = args
  for i in range(5):  # Depth 0 to 5 (6 levels)
    current["arg"] = {"call": f"fn{i}", "args": {}}
    current = current["arg"]["args"]

  payload = {
      "components": [{
          "id": "root",
          "componentProperties": {
              "Button": {
                  "label": "Click me",
                  "action": {"functionCall": {"call": "fn_top", "args": args}},
              }
          },
      }]
  }
  with pytest.raises(ValueError, match="Recursion limit exceeded"):
    validate_a2ui_json(payload, schema)


def test_validate_recursion_limit_valid(schema):
  """Test that recursion depth <= 5 is allowed."""
  # Construct max depth function call (Depth 5)
  args = {}
  current = args
  for i in range(4):  # Depth 0 to 4 (5 levels)
    current["arg"] = {"call": f"fn{i}", "args": {}}
    current = current["arg"]["args"]

  payload = {
      "components": [{
          "id": "root",
          "componentProperties": {
              "Button": {
                  "label": "Click me",
                  "action": {"functionCall": {"call": "fn_top", "args": args}},
              }
          },
      }]
  }
  validate_a2ui_json(payload, schema)


@pytest.mark.parametrize(
    "payload",
    [
        {
            "updateDataModel": {
                "surfaceId": "surface1",
                "path": "invalid//path",
                "value": "data",
            }
        },
        {
            "components": [{
                "id": "root",
                "componentProperties": {
                    "Text": {"text": {"path": "invalid path with spaces"}}
                },
            }]
        },
        {
            "updateDataModel": {
                "surfaceId": "surface1",
                "path": "/invalid/escape/~2",
                "value": "data",
            }
        },
    ],
)
def test_validate_invalid_paths(schema, payload):
  """Test various invalid paths (JSON Pointer syntax)."""
  with pytest.raises(ValueError, match="Invalid JSON Pointer syntax"):
    validate_a2ui_json(payload, schema)


def test_validate_global_recursion_limit_exceeded(schema):
  """Test that global recursion depth > 50 raises ValueError."""
  # Create a deeply nested dictionary
  deep_payload = {"level": 0}
  current = deep_payload
  for i in range(55):
    current["next"] = {"level": i + 1}
    current = current["next"]

  with pytest.raises(ValueError, match="Global recursion limit exceeded"):
    validate_a2ui_json(deep_payload, schema)


def test_validate_custom_schema_reference():
  """Test validation with a custom schema where a component has a non-standard reference field."""
  # Custom schema extending the base one
  custom_schema = {
      "type": "object",
      "$defs": {
          "ComponentId": {"type": "string"},
          "ChildList": {"type": "array", "items": {"$ref": "#/$defs/ComponentId"}},
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
                                      "linkedComponentId": {
                                          "$ref": "#/$defs/ComponentId"
                                      }
                                  },
                              }
                          },
                      },
                  },
                  "required": ["id"],
              },
          }
      },
  }

  payload = {
      "components": [{
          "id": "root",
          "componentProperties": {
              "CustomLink": {"linkedComponentId": "missing_target"}
          },
      }]
  }

  with pytest.raises(
      ValueError,
      match=(
          "Component 'root' references missing ID 'missing_target' in field"
          " 'linkedComponentId'"
      ),
  ):
    validate_a2ui_json(payload, custom_schema)
