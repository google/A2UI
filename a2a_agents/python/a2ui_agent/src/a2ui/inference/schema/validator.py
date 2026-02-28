# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import copy
import re
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Set, Tuple, Union, Iterator

from jsonschema import Draft202012Validator

if TYPE_CHECKING:
  from .catalog import A2uiCatalog

from .constants import (
    BASE_SCHEMA_URL,
    CATALOG_COMPONENTS_KEY,
    CATALOG_ID_KEY,
    CATALOG_STYLES_KEY,
    VERSION_0_8,
    VERSION_0_9,
)

# RFC 6901 compliant regex for JSON Pointer
JSON_POINTER_PATTERN = re.compile(r"^(?:\/(?:[^~\/]|~[01])*)*$")

# Recursion Limits
MAX_GLOBAL_DEPTH = 50
MAX_FUNC_CALL_DEPTH = 5

# Constants
COMPONENTS = "components"
ID = "id"
ROOT = "root"
PATH = "path"
FUNCTION_CALL = "functionCall"
CALL = "call"
ARGS = "args"


def _inject_additional_properties(
    schema: Dict[str, Any],
    source_properties: Dict[str, Any],
    mapping: Dict[str, str] = None,
) -> Tuple[Dict[str, Any], Set[str]]:
  """
  Recursively injects properties from source_properties into nodes with additionalProperties=True and sets additionalProperties=False.

  Args:
      schema: The target schema to traverse and patch.
      source_properties: A dictionary of top-level property groups (e.g., "components", "styles") from the source schema.

  Returns:
      A tuple containing:
      - The patched schema.
      - A set of keys from source_properties that were injected.
  """
  injected_keys = set()

  def recursive_inject(obj):
    if isinstance(obj, dict):
      new_obj = {}
      for k, v in obj.items():
        # If this node has additionalProperties=True, we inject the source properties
        if isinstance(v, dict) and v.get("additionalProperties") is True:
          if k in source_properties:
            injected_keys.add(k)
            new_node = dict(v)
            new_node["additionalProperties"] = False
            new_node["properties"] = {
                **new_node.get("properties", {}),
                **source_properties[k],
            }
            new_obj[k] = new_node
          else:  # No matching source group, keep as is but recurse children
            new_obj[k] = recursive_inject(v)
        else:  # Not a node with additionalProperties, recurse children
          new_obj[k] = recursive_inject(v)
      return new_obj
    elif isinstance(obj, list):
      return [recursive_inject(i) for i in obj]
    return obj

  return recursive_inject(schema), injected_keys


# LLM is instructed to generate a list of messages, so we wrap the bundled schema in an array.
def _wrap_main_schema(schema: Dict[str, Any]) -> Dict[str, Any]:
  return {"type": "array", "items": schema}


class A2uiValidator:
  """Validates the A2UI JSON payload against the provided schema and checks for integrity.

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

  def __init__(self, catalog: "A2uiCatalog"):
    self._catalog = catalog
    self._validator = self._build_validator()

  def _build_validator(self) -> Draft202012Validator:
    """Builds a validator for the A2UI schema."""

    if self._catalog.version == VERSION_0_8:
      return self._build_0_8_validator()
    return self._build_0_9_validator()

  def _bundle_0_8_schemas(self) -> Dict[str, Any]:
    if not self._catalog.s2c_schema:
      return {}

    bundled = copy.deepcopy(self._catalog.s2c_schema)

    # Prepare catalog components and styles for injection
    source_properties = {}
    catalog_schema = self._catalog.catalog_schema
    if catalog_schema:
      if CATALOG_COMPONENTS_KEY in catalog_schema:
        # Special mapping for v0.8: "components" -> "component"
        source_properties["component"] = catalog_schema[CATALOG_COMPONENTS_KEY]
      if CATALOG_STYLES_KEY in catalog_schema:
        source_properties[CATALOG_STYLES_KEY] = catalog_schema[CATALOG_STYLES_KEY]

    bundled, _ = _inject_additional_properties(bundled, source_properties)
    return bundled

  def _build_0_8_validator(self) -> Draft202012Validator:
    """Builds a validator for the A2UI schema version 0.8."""
    bundled_schema = self._bundle_0_8_schemas()
    full_schema = _wrap_main_schema(bundled_schema)

    from referencing import Registry, Resource
    from referencing.jsonschema import DRAFT202012

    # Even in v0.8, we may have references to common_types.json or other files.
    base_uri = self._catalog.s2c_schema.get("$id", BASE_SCHEMA_URL)
    import os

    def get_sibling_uri(uri, filename):
      return os.path.join(os.path.dirname(uri), filename)

    common_types_uri = get_sibling_uri(base_uri, "common_types.json")

    resources = [
        (
            common_types_uri,
            Resource.from_contents(
                self._catalog.common_types_schema,
                default_specification=DRAFT202012,
            ),
        ),
        (
            "common_types.json",
            Resource.from_contents(
                self._catalog.common_types_schema,
                default_specification=DRAFT202012,
            ),
        ),
    ]

    registry = Registry().with_resources(resources)
    validator_schema = copy.deepcopy(full_schema)
    validator_schema["$schema"] = "https://json-schema.org/draft/2020-12/schema"

    return Draft202012Validator(validator_schema, registry=registry)

  def _build_0_9_validator(self) -> Draft202012Validator:
    """Builds a validator for the A2UI schema version 0.9+."""
    full_schema = _wrap_main_schema(self._catalog.s2c_schema)

    from referencing import Registry, Resource
    from referencing.jsonschema import DRAFT202012

    # v0.9 schemas (e.g. server_to_client.json) use relative references like
    # 'catalog.json#/$defs/anyComponent'. Since server_to_client.json has
    # $id: https://a2ui.org/specification/v0_9/server_to_client.json,
    # these resolve to https://a2ui.org/specification/v0_9/catalog.json.
    # We must register them using these absolute URIs.
    base_uri = self._catalog.s2c_schema.get("$id", BASE_SCHEMA_URL)
    import os

    def get_sibling_uri(uri, filename):
      return os.path.join(os.path.dirname(uri), filename)

    catalog_uri = get_sibling_uri(base_uri, "catalog.json")
    common_types_uri = get_sibling_uri(base_uri, "common_types.json")

    resources = [
        (
            common_types_uri,
            Resource.from_contents(
                self._catalog.common_types_schema,
                default_specification=DRAFT202012,
            ),
        ),
        (
            catalog_uri,
            Resource.from_contents(
                self._catalog.catalog_schema,
                default_specification=DRAFT202012,
            ),
        ),
        # Fallbacks for robustness
        (
            "catalog.json",
            Resource.from_contents(
                self._catalog.catalog_schema,
                default_specification=DRAFT202012,
            ),
        ),
        (
            "common_types.json",
            Resource.from_contents(
                self._catalog.common_types_schema,
                default_specification=DRAFT202012,
            ),
        ),
    ]
    # Also register the catalog ID if it's different from the catalog URI
    if self._catalog.catalog_id and self._catalog.catalog_id != catalog_uri:
      resources.append((
          self._catalog.catalog_id,
          Resource.from_contents(
              self._catalog.catalog_schema,
              default_specification=DRAFT202012,
          ),
      ))

    registry = Registry().with_resources(resources)
    validator_schema = copy.deepcopy(full_schema)
    validator_schema["$schema"] = "https://json-schema.org/draft/2020-12/schema"

    return Draft202012Validator(validator_schema, registry=registry)

  def validate(self, a2ui_json: Union[Dict[str, Any], List[Any]]) -> None:
    """Validates an A2UI messages against the schema."""
    messages = a2ui_json if isinstance(a2ui_json, list) else [a2ui_json]

    # Basic schema validation
    error = next(self._validator.iter_errors(messages), None)
    if error is not None:
      msg = f"Validation failed: {error.message}"
      if error.context:
        msg += "\nContext failures:"
        for sub_error in error.context:
          msg += f"\n  - {sub_error.message}"
      raise ValueError(msg)

    root_id = _find_root_id(messages)

    for message in messages:
      if not isinstance(message, dict):
        continue

      components = None
      if "surfaceUpdate" in message:  # v0.8
        components = message["surfaceUpdate"].get(COMPONENTS)
      elif "updateComponents" in message and isinstance(
          message["updateComponents"], dict
      ):  # v0.9
        components = message["updateComponents"].get(COMPONENTS)

      if components:
        ref_map = _extract_component_ref_fields(self._catalog)
        _validate_component_integrity(root_id, components, ref_map)
        _validate_topology(root_id, components, ref_map)

      _validate_recursion_and_paths(message)


def _find_root_id(messages: List[Dict[str, Any]]) -> str:
  """
  Finds the root id from a list of A2UI messages.
  - For v0.8, the root id is in the beginRendering message.
  - For v0.9+, the root id is 'root'.
  """
  for message in messages:
    if not isinstance(message, dict):
      continue
    if "beginRendering" in message:
      return message["beginRendering"].get(ROOT, ROOT)
  return ROOT


def _validate_component_integrity(
    root_id: str,
    components: List[Dict[str, Any]],
    ref_fields_map: Dict[str, tuple[Set[str], Set[str]]],
) -> None:
  """
  Validates that:
  1. All component IDs are unique.
  2. A 'root' component exists.
  3. All references point to existing IDs.
  """
  ids: Set[str] = set()

  # 1. Collect IDs and check for duplicates
  for comp in components:
    comp_id = comp.get(ID)
    if comp_id is None:
      continue

    if comp_id in ids:
      raise ValueError(f"Duplicate component ID: {comp_id}")
    ids.add(comp_id)

  # 2. Check for root component
  if root_id not in ids:
    raise ValueError(f"Missing root component: No component has id='{root_id}'")

  # 3. Check for dangling references using helper
  for comp in components:
    for ref_id, field_name in _get_component_references(comp, ref_fields_map):
      if ref_id not in ids:
        raise ValueError(
            f"Component '{comp.get(ID)}' references non-existent component '{ref_id}'"
            f" in field '{field_name}'"
        )


def _validate_topology(
    root_id: str,
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

  # Detect Cycles and Depth using DFS
  visited: Set[str] = set()
  recursion_stack: Set[str] = set()

  def dfs(node_id: str, depth: int):
    if depth > MAX_GLOBAL_DEPTH:
      raise ValueError(
          f"Global recursion limit exceeded: logical depth > {MAX_GLOBAL_DEPTH}"
      )

    visited.add(node_id)
    recursion_stack.add(node_id)

    for neighbor in adj_list.get(node_id, []):
      if neighbor not in visited:
        dfs(neighbor, depth + 1)
      elif neighbor in recursion_stack:
        raise ValueError(
            f"Circular reference detected involving component '{neighbor}'"
        )

    recursion_stack.remove(node_id)

  if root_id in all_ids:
    dfs(root_id, 0)

  # Check for Orphans
  orphans = all_ids - visited
  if orphans:
    sorted_orphans = sorted(list(orphans))
    raise ValueError(
        f"Component '{sorted_orphans[0]}' is not reachable from '{root_id}'"
    )


def _extract_component_ref_fields(
    catalog: "A2uiCatalog",
) -> Dict[str, tuple[Set[str], Set[str]]]:
  """
  Parses the catalog/schema to identify which component properties reference other components.
  Returns a map: { component_name: (set_of_single_ref_fields, set_of_list_ref_fields) }
  """
  ref_map = {}

  all_components = {}
  # Version aware extraction
  if catalog.version == VERSION_0_8:
    # Search for components in s2c schema properties
    try:
      # Try nested path: surfaceUpdate -> components -> items -> properties -> component -> properties
      s2c = catalog.s2c_schema or {}
      props = s2c.get("properties", {})

      # Might be in surfaceUpdate or beginRendering component definitions
      if "surfaceUpdate" in props:
        su = props["surfaceUpdate"].get("properties", {})
        if "components" in su:
          items = su["components"].get("items", {})
          if "properties" in items:
            comp_wrapper = items["properties"].get("component", {})
            all_components = comp_wrapper.get("properties", {})
    except Exception:
      logging.warning("Failed to extract component ref fields from v0.8 schema")

    # Also check catalog schema if available
    if not all_components and catalog.catalog_schema:
      all_components = catalog.catalog_schema.get(COMPONENTS, {})
  else:  # v0.9+
    # In v0.9, components are defined in the catalog itself
    all_components = catalog.catalog_schema.get(COMPONENTS, {})

  # Helper to check if a property schema looks like a ComponentId reference
  def is_component_id_ref(prop_schema: Dict[str, Any]) -> bool:
    if not isinstance(prop_schema, dict):
      return False
    ref = prop_schema.get("$ref", "")
    if isinstance(ref, str) and (
        ref.endswith("ComponentId") or ref.endswith("child") or "/child" in ref
    ):
      return True

    # Inline check
    if (
        prop_schema.get("type") == "string"
        and prop_schema.get("title") == "ComponentId"
    ):
      return True

    # Check oneOf/anyOf for refs
    for key in ["oneOf", "anyOf", "allOf"]:
      if key in prop_schema:
        for sub in prop_schema[key]:
          if is_component_id_ref(sub):
            return True
    return False

  def is_child_list_ref(prop_schema: Dict[str, Any]) -> bool:
    if not isinstance(prop_schema, dict):
      return False
    ref = prop_schema.get("$ref", "")
    if isinstance(ref, str) and (
        ref.endswith("ChildList") or ref.endswith("children") or "/children" in ref
    ):
      return True

    # Inline check
    if prop_schema.get("type") == "object":
      props = prop_schema.get("properties", {})
      if "explicitList" in props or "template" in props or "componentId" in props:
        return True

    # Or array of ComponentIds
    if prop_schema.get("type") == "array":
      items = prop_schema.get("items", {})
      if is_component_id_ref(items):
        return True

    # Check oneOf/anyOf for refs
    for key in ["oneOf", "anyOf", "allOf"]:
      if key in prop_schema:
        for sub in prop_schema[key]:
          if is_child_list_ref(sub):
            return True
    return False

  for comp_name, comp_schema in all_components.items():
    single_refs = set()
    list_refs = set()

    def extract_from_props(cs: Dict[str, Any]):
      if not isinstance(cs, dict):
        return
      props = cs.get("properties", {})
      for prop_name, prop_schema in props.items():
        if is_component_id_ref(prop_schema) or prop_name in [
            "child",
            "contentChild",
            "entryPointChild",
        ]:
          single_refs.add(prop_name)
        elif is_child_list_ref(prop_schema) or prop_name == "children":
          list_refs.add(prop_name)

      # Recurse into allOf/oneOf for properties
      for key in ["allOf", "oneOf", "anyOf"]:
        if key in cs:
          for sub in cs[key]:
            extract_from_props(sub)

    extract_from_props(comp_schema)

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
  # Support both v0.8 and v0.9+
  comp_type = None
  props = {}

  if "component" in component:
    comp_val = component.get("component")
    if isinstance(comp_val, str):
      # v0.9 flattened
      yield from _get_refs_recursively(comp_val, component, ref_fields_map)
    elif isinstance(comp_val, dict):
      # v0.8 structured
      for c_type, c_props in comp_val.items():
        # Recurse into the properties container
        if isinstance(c_props, dict):
          yield from _get_refs_recursively(c_type, c_props, ref_fields_map)


def _get_refs_recursively(
    comp_type: str,
    props: Dict[str, Any],
    ref_fields_map: Dict[str, tuple[Set[str], Set[str]]],
) -> Iterator[Tuple[str, str]]:
  if not comp_type or not isinstance(props, dict):
    return

  single_refs, list_refs = ref_fields_map.get(comp_type, (set(), set()))

  for key, value in props.items():
    if key in single_refs:
      if isinstance(value, str):
        yield value, key
      elif isinstance(value, dict) and "componentId" in value:  # ChildList template
        yield value["componentId"], f"{key}.componentId"
    elif key in list_refs:
      if isinstance(value, list):
        for item in value:
          if isinstance(item, str):
            yield item, key
      elif isinstance(value, dict):
        if "explicitList" in value:
          for item in value["explicitList"]:
            if isinstance(item, str):
              yield item, f"{key}.explicitList"
        elif "template" in value:
          template = value["template"]
          if isinstance(template, dict) and "componentId" in template:
            yield template["componentId"], f"{key}.template.componentId"
        elif "componentId" in value:
          yield value["componentId"], f"{key}.componentId"

    # Special handling for 'tabs' or other nested arrays
    if isinstance(value, list) and key not in list_refs:
      for idx, item in enumerate(value):
        if isinstance(item, dict):
          # Check for common patterns like {title, child}
          child_id = item.get("child")
          if child_id and isinstance(child_id, str):
            yield child_id, f"{key}[{idx}].child"


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
