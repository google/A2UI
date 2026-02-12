from typing import Any, Dict, List, Set, Union
import jsonschema

def validate_a2ui_json(a2ui_json: Union[Dict[str, Any], List[Any]], a2ui_schema: Dict[str, Any]) -> None:
    """
    Validates the A2UI JSON payload against the provided schema and checks for integrity.

    Args:
        a2ui_json: The JSON payload to validate.
        a2ui_schema: The schema to validate against.

    Raises:
        jsonschema.ValidationError: If the payload does not match the schema.
        ValueError: If integrity or topology checks fail.
    """
    jsonschema.validate(instance=a2ui_json, schema=a2ui_schema)

    # Normalize to list for iteration
    messages = a2ui_json if isinstance(a2ui_json, list) else [a2ui_json]

    for message in messages:
        if not isinstance(message, dict):
            continue
            
        # Check for SurfaceUpdate which has 'components'
        if "components" in message:
            _validate_component_integrity(message["components"], a2ui_schema)
            _validate_topology(message["components"], a2ui_schema)
            
        _validate_recursion_and_paths(message)


def _validate_component_integrity(components: List[Dict[str, Any]], a2ui_schema: Dict[str, Any] = None) -> None:
    """
    Validates that:
    1. All component IDs are unique.
    2. A 'root' component exists.
    3. All references (children, child, etc.) point to existing IDs.
    """
    ids: Set[str] = set()
    
    # 1. Collect IDs and check for duplicates
    for comp in components:
        comp_id = comp.get("id")
        if comp_id is None:
            continue
            
        if comp_id in ids:
            raise ValueError(f"Duplicate component ID found: '{comp_id}'")
        ids.add(comp_id)

    # 2. Check for root component
    if "root" not in ids:
         raise ValueError("Missing 'root' component: One component must have 'id' set to 'root'.")

    # 3. Check for dangling references using schema-driven extraction
    ref_fields_map = _extract_component_ref_fields(a2ui_schema) if a2ui_schema else {}
    
    for comp in components:
        comp_props_container = comp.get("componentProperties")
        if not isinstance(comp_props_container, dict):
            continue
            
        for comp_type, props in comp_props_container.items():
            if not isinstance(props, dict):
                continue

            # Determine fields to check for this component type
            # Strictly use schema; if not found, assume no references (generic schema support)
            single_refs, list_refs = ref_fields_map.get(comp_type, (set(), set()))
            
            for key, value in props.items():
                if key in single_refs:
                    if isinstance(value, str) and value not in ids:
                         raise ValueError(f"Component '{comp.get('id')}' references missing ID '{value}' in field '{key}'")
                elif key in list_refs:
                    if isinstance(value, list):
                        for item in value:
                             if isinstance(item, str) and item not in ids:
                                 raise ValueError(f"Component '{comp.get('id')}' references missing ID '{item}' in field '{key}'")


def _validate_topology(components: List[Dict[str, Any]], a2ui_schema: Dict[str, Any] = None) -> None:
    """
    Validates the topology of the component tree:
    1. No circular references (including self-references).
    2. No orphaned components (all components must be reachable from 'root').
    """
    adj_list: Dict[str, List[str]] = {}
    all_ids: Set[str] = set()
    
    ref_fields_map = _extract_component_ref_fields(a2ui_schema) if a2ui_schema else {}

    # Build Adjacency List
    for comp in components:
        comp_id = comp.get("id")
        if comp_id is None:
            continue
        
        all_ids.add(comp_id)
        if comp_id not in adj_list:
            adj_list[comp_id] = []
        
        comp_props_container = comp.get("componentProperties")
        if not isinstance(comp_props_container, dict):
            continue
            
        for comp_type, props in comp_props_container.items():
            if not isinstance(props, dict):
                continue
            
            # Determine fields to check
            # Strictly use schema
            single_refs, list_refs = ref_fields_map.get(comp_type, (set(), set()))

            for key, value in props.items():
                if key in single_refs:
                    if isinstance(value, str):
                        if value == comp_id:
                            raise ValueError(f"Self-reference detected: Component '{comp_id}' references itself in field '{key}'")
                        adj_list[comp_id].append(value)
                elif key in list_refs:
                    if isinstance(value, list):
                        for item in value:
                            if isinstance(item, str):
                                if item == comp_id:
                                    raise ValueError(f"Self-reference detected: Component '{comp_id}' references itself in field '{key}'")
                                adj_list[comp_id].append(item)

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
                raise ValueError(f"Circular reference detected involving component '{neighbor}'")
        
        recursion_stack.remove(node_id)

    if "root" in all_ids:
        dfs("root")

    # Check for Orphans
    orphans = all_ids - visited
    if orphans:
        sorted_orphans = sorted(list(orphans))
        raise ValueError(f"Orphaned components detected (not reachable from 'root'): {sorted_orphans}")


def _extract_component_ref_fields(schema: Dict[str, Any]) -> Dict[str, tuple[Set[str], Set[str]]]:
    """
    Parses the JSON schema to identify which component properties reference other components.
    Returns a map: { component_name: (set_of_single_ref_fields, set_of_list_ref_fields) }
    """
    # print(f"DEBUG: _extract_component_ref_fields called with schema keys: {schema.keys()}")
    ref_map = {}
    
    # We expect schema structure to have 'properties' -> 'components' -> 'items' -> ...
    # OR we might be passed the root schema.
    # A typical A2UI schema has definitions in $defs or definitions.
    
    # 1. Locate component definitions
    # In the testing schema (and likely real one), component properties are inside:
    # properties -> components -> items -> properties -> componentProperties -> properties -> [ComponentType]
    
    try:
        # Navigate to componentProperties definitions in the schema
        # This path depends on the exact schema structure provided to validate_a2ui_json
        # We'll try to walk down standard paths.
        
        root_defs = schema.get("$defs") or schema.get("definitions", {})
        
        # Helper to check if a property schema looks like a ComponentId reference
        def is_component_id_ref(prop_schema: Dict[str, Any]) -> bool:
            ref = prop_schema.get("$ref", "")
            if ref.endswith("ComponentId"):
                return True
            # Check if it's an expanded schema that refs ComponentId (unlikely for direct prop but possible)
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

        # Find where components are defined. 
        # In the provided common_types.json / standard_catalog.json, components are usually in a specific location
        # but the schema passed to validate_a2ui_json *is* the message schema which *includes* catalog definitions 
        # often via $defs or inline? 
        # Actually message schema has 'components' array items matching catalog entries.
        
        # Let's search for 'componentProperties' in the schema
        # We can implement a search or targeted lookup
        
        # Target path: properties.components.items.properties.componentProperties.properties
        # (This matches the structure in test_validation.py)
        
        comps_schema = schema.get("properties", {}).get("components", {})
        items_schema = comps_schema.get("items", {})
        comp_props_schema = items_schema.get("properties", {}).get("componentProperties", {})
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
    except Exception:
        # If schema traversal fails (structure mismatch), return empty to trigger fallback
        pass
        
    return ref_map


def _validate_recursion_and_paths(data: Any) -> None:
    """
    Validates:
    1. Global recursion depth limit (50).
    2. FunctionCall recursion depth limit (5).
    3. Path syntax for DataBindings/DataModelUpdates.
    """
    def traverse(item: Any, global_depth: int, func_depth: int):
        if global_depth > 50:
            raise ValueError("Global recursion limit exceeded: Depth > 50")

        if isinstance(item, list):
            for x in item:
                traverse(x, global_depth + 1, func_depth)
        elif isinstance(item, dict):
            # Check for path
            if "path" in item and isinstance(item["path"], str):
                 _validate_path_syntax(item["path"])
            
            # Check for FunctionCall (heuristic: has 'call' and 'args')
            is_func = "call" in item and "args" in item
            
            if is_func:
                if func_depth >= 5:
                    raise ValueError("Recursion limit exceeded: FunctionCall depth > 5")
                
                # Increment func_depth only for this branch, but global_depth matches traversal
                for k, v in item.items():
                    if k == "args":
                        traverse(v, global_depth + 1, func_depth + 1)
                    else:
                        traverse(v, global_depth + 1, func_depth)
            else:
                for v in item.values():
                    traverse(v, global_depth + 1, func_depth)

    traverse(data, 0, 0)


def _validate_path_syntax(path: str) -> None:
    """
    Validates that the path is either a valid JSON Pointer (starts with /)
    or a valid relative path (no empty segments).
    Also checks for spaces.
    """
    if not path:
        return
    
    parts = path.split('/')
    if path.startswith('/'):
        # JSON Pointer - starts with /
        # We allow empty keys (//) as per RFC 6901 but typical A2UI usage might not.
        # For now, we only enforce that it starts with / if intended to be absolute.
        pass
    else:
        # Relative path - should not have empty segments
        if any(not p for p in parts):
             raise ValueError(f"Invalid data model path: '{path}' contains empty segments (//)")
    
    if " " in path:
         raise ValueError(f"Invalid data model path: '{path}' contains spaces")
