from typing import Any, Dict, Iterator, List, Set, Tuple, Union
import jsonschema
import re

# RFC 6901 compliant regex for JSON Pointer
JSON_POINTER_PATTERN = re.compile(r"^(?:\/(?:[^~\/]|~[01])*)*$")

# Recursion Limits
MAX_GLOBAL_DEPTH = 50
MAX_FUNC_CALL_DEPTH = 5

# Constants
COMPONENTS = "components"
ID = "id"
COMPONENT_PROPERTIES = "componentProperties"
ROOT = "root"
PATH = "path"
FUNCTION_CALL = "functionCall"
CALL = "call"
ARGS = "args"


def validate_a2ui_json(
    a2ui_json: Union[Dict[str, Any], List[Any]], a2ui_schema: Dict[str, Any]
) -> None:
  """
  Validates the A2UI JSON payload against the provided schema and checks for integrity.

  Checks performed:
  1.  **JSON Schema Validation**: Ensures payload adheres to the A2UI schema.
  2.  **Component Integrity**:
      -   All component IDs are unique.
      -   A 'root' component exists.
      -   All unique component references point to valid IDs.
  3.  **Topology**:
      -   No circular references (including self-references).
      -   No orphaned components (all components must be reachable from 'root').
  4.  **Recursion Limits**:
      -   Global recursion depth limit (50).
      -   FunctionCall recursion depth limit (5).
  5.  **Path Syntax**:
      -   Validates JSON Pointer syntax for data paths.

  Args:
      a2ui_json: The JSON payload to validate.
      a2ui_schema: The schema to validate against.

  Raises:
      jsonschema.ValidationError: If the payload does not match the schema.
      ValueError: If integrity, topology, or recursion checks fail.
  """
  jsonschema.validate(instance=a2ui_json, schema=a2ui_schema)

  # Normalize to list for iteration
  messages = a2ui_json if isinstance(a2ui_json, list) else [a2ui_json]

  for message in messages:
    if not isinstance(message, dict):
      continue

    # Check for SurfaceUpdate which has 'components'
    if COMPONENTS in message:
      ref_map = _extract_component_ref_fields(a2ui_schema)
      _validate_component_integrity(message[COMPONENTS], ref_map)
      _validate_topology(message[COMPONENTS], ref_map)

    _validate_recursion_and_paths(message)


def _validate_component_integrity(
    components: List[Dict[str, Any]],
    ref_fields_map: Dict[str, tuple[Set[str], Set[str]]],
) -> None:
  """
  Validates that:
  1. All component IDs are unique.
  2. A 'root' component exists.
  3. All references (children, child, etc.) point to existing IDs.
  """
  ids: Set[str] = set()

  # 1. Collect IDs and check for duplicates
  for comp in components:
    comp_id = comp.get(ID)
    if comp_id is None:
      continue

    if comp_id in ids:
      raise ValueError(f"Duplicate component ID found: '{comp_id}'")
    ids.add(comp_id)

  # 2. Check for root component
  if ROOT not in ids:
    raise ValueError(
        f"Missing '{ROOT}' component: One component must have '{ID}' set to '{ROOT}'."
    )

  # 3. Check for dangling references using helper
  for comp in components:
    for ref_id, field_name in _get_component_references(comp, ref_fields_map):
      if ref_id not in ids:
        raise ValueError(
            f"Component '{comp.get(ID)}' references missing ID '{ref_id}' in field"
            f" '{field_name}'"
        )


def _validate_topology(
    components: List[Dict[str, Any]],
    ref_fields_map: Dict[str, tuple[Set[str], Set[str]]],
) -> None:
  """
  Validates the topology of the component tree:
  1. No circular references (including self-references).
  2. No orphaned components (all components must be reachable from 'root').
  """
  adj_list: Dict[str, List[str]] = {}
  all_ids: Set[str] = set()

  # Build Adjacency List
  for comp in components:
    comp_id = comp.get(ID)
    if comp_id is None:
      continue

    all_ids.add(comp_id)
    if comp_id not in adj_list:
      adj_list[comp_id] = []

    for ref_id, field_name in _get_component_references(comp, ref_fields_map):
      if ref_id == comp_id:
        raise ValueError(
            f"Self-reference detected: Component '{comp_id}' references itself in field"
            f" '{field_name}'"
        )
      adj_list[comp_id].append(ref_id)

  # Detect Cycles using DFS
  visited: Set[str] = set()
  recursion_stack: Set[str] = set()

  def dfs(node_id: str):
    visited.add(node_id)
    recursion_stack.add(node_id)

    for neighbor in adj_list.get(node_id, []):
      if neighbor not in visited:
        dfs(neighbor)
      elif neighbor in recursion_stack:
        raise ValueError(
            f"Circular reference detected involving component '{neighbor}'"
        )

    recursion_stack.remove(node_id)

  if ROOT in all_ids:
    dfs(ROOT)

  # Check for Orphans
  orphans = all_ids - visited
  if orphans:
    sorted_orphans = sorted(list(orphans))
    raise ValueError(
        f"Orphaned components detected (not reachable from '{ROOT}'): {sorted_orphans}"
    )


def _extract_component_ref_fields(
    schema: Dict[str, Any],
) -> Dict[str, tuple[Set[str], Set[str]]]:
  """
  Parses the JSON schema to identify which component properties reference other components.
  Returns a map: { component_name: (set_of_single_ref_fields, set_of_list_ref_fields) }
  """
  ref_map = {}

  root_defs = schema.get("$defs") or schema.get("definitions", {})

  # Helper to check if a property schema looks like a ComponentId reference
  def is_component_id_ref(prop_schema: Dict[str, Any]) -> bool:
    ref = prop_schema.get("$ref", "")
    if ref.endswith("ComponentId"):
      return True
    return False

  def is_child_list_ref(prop_schema: Dict[str, Any]) -> bool:
    ref = prop_schema.get("$ref", "")
    if ref.endswith("ChildList"):
      return True
    # Or array of ComponentIds
    if prop_schema.get("type") == "array":
      items = prop_schema.get("items", {})
      if is_component_id_ref(items):
        return True
    return False

  comps_schema = schema.get("properties", {}).get(COMPONENTS, {})
  items_schema = comps_schema.get("items", {})
  comp_props_schema = items_schema.get("properties", {}).get(COMPONENT_PROPERTIES, {})
  all_components = comp_props_schema.get("properties", {})

  for comp_name, comp_schema in all_components.items():
    single_refs = set()
    list_refs = set()

    props = comp_schema.get("properties", {})
    for prop_name, prop_schema in props.items():
      if is_component_id_ref(prop_schema):
        single_refs.add(prop_name)
      elif is_child_list_ref(prop_schema):
        list_refs.add(prop_name)

    if single_refs or list_refs:
      ref_map[comp_name] = (single_refs, list_refs)

  return ref_map


def _get_component_references(
    component: Dict[str, Any], ref_fields_map: Dict[str, tuple[Set[str], Set[str]]]
) -> Iterator[Tuple[str, str]]:
  """
  Helper to extract all referenced component IDs from a component.
  Yields (referenced_id, field_name).
  """
  comp_props_container = component.get(COMPONENT_PROPERTIES)
  if not isinstance(comp_props_container, dict):
    return

  for comp_type, props in comp_props_container.items():
    if not isinstance(props, dict):
      continue

    single_refs, list_refs = ref_fields_map.get(comp_type, (set(), set()))

    for key, value in props.items():
      if key in single_refs:
        if isinstance(value, str):
          yield value, key
      elif key in list_refs:
        if isinstance(value, list):
          for item in value:
            if isinstance(item, str):
              yield item, key


def _validate_recursion_and_paths(data: Any) -> None:
  """
  Validates:
  1. Global recursion depth limit (50).
  2. FunctionCall recursion depth limit (5).
  3. Path syntax for DataBindings/DataModelUpdates.
  """

  def traverse(item: Any, global_depth: int, func_depth: int):
    if global_depth > MAX_GLOBAL_DEPTH:
      raise ValueError(f"Global recursion limit exceeded: Depth > {MAX_GLOBAL_DEPTH}")

    if isinstance(item, list):
      for x in item:
        traverse(x, global_depth + 1, func_depth)
      return

    if isinstance(item, dict):
      # Check for path
      if PATH in item and isinstance(item[PATH], str):
        path = item[PATH]
        if not re.fullmatch(JSON_POINTER_PATTERN, path):
          raise ValueError(f"Invalid JSON Pointer syntax: '{path}'")

      # Check for FunctionCall
      is_func = CALL in item and ARGS in item

      if is_func:
        if func_depth >= MAX_FUNC_CALL_DEPTH:
          raise ValueError(
              f"Recursion limit exceeded: {FUNCTION_CALL} depth > {MAX_FUNC_CALL_DEPTH}"
          )

        # Increment func_depth only for 'args', but global_depth matches traversal
        for k, v in item.items():
          if k == ARGS:
            traverse(v, global_depth + 1, func_depth + 1)
          else:
            traverse(v, global_depth + 1, func_depth)
      else:
        for v in item.values():
          traverse(v, global_depth + 1, func_depth)

  traverse(data, 0, 0)
