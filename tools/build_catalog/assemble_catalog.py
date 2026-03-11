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

# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "jsonschema",
# ]
# ///

import argparse
import json
import urllib.request
import urllib.parse
from urllib.error import URLError
import sys
import copy
import logging
from pathlib import Path
from typing import Any, Optional

# Set up logging
logger = logging.getLogger("a2ui-assembler")


class CatalogError(Exception):
  """Base exception for catalog assembly errors."""
  pass


def is_remote_uri(uri: str) -> bool:
  """Checks if the given URI is an HTTP/HTTPS address."""
  return uri.startswith(("http://", "https://"))


BASIC_CATALOG_URLS = {
    "0.9": "https://raw.githubusercontent.com/google/A2UI/refs/heads/main/specification/v0_9/json/basic_catalog.json",
    "0.10": "https://raw.githubusercontent.com/google/A2UI/refs/heads/main/specification/v0_10/json/basic_catalog.json"
}

COMMON_TYPES_URLS = {
    "0.9": "https://raw.githubusercontent.com/google/A2UI/refs/heads/main/specification/v0_9/json/common_types.json",
    "0.10": "https://raw.githubusercontent.com/google/A2UI/refs/heads/main/specification/v0_10/json/common_types.json"
}


class CatalogAssembler:
  def __init__(self, version: str,
      local_basic_catalog_path: Optional[str] = None,
      local_common_types_path: Optional[str] = None, max_depth: int = 50):
    self.version = version
    self.local_basic_catalog_path = local_basic_catalog_path
    self.local_common_types_path = local_common_types_path
    self.max_depth = max_depth  # Protects against circular $ref dependencies
    self.definitions = {}
    self.ref_mapping = {}
    self.used_def_keys = set()
    self.file_cache = {}

  def fetch_json(self, uri: str) -> dict:
    """Fetches and caches JSON content from a local file or remote URL."""
    if uri in self.file_cache:
      return self.file_cache[uri]

    try:
      if is_remote_uri(uri):
        logger.debug(f"Fetching remote JSON: {uri}")
        req = urllib.request.Request(uri, headers={
            'User-Agent': 'A2UI-Assembler/1.0'})
        # Use a timeout to prevent blocking indefinitely on slow remote resources
        with urllib.request.urlopen(req, timeout=10) as response:
          data = json.load(response)
      else:
        path = Path(uri)
        logger.debug(f"Reading local JSON: {path}")
        data = json.loads(path.read_text(encoding='utf-8'))

      self.file_cache[uri] = data
      return data
    except FileNotFoundError:
      raise CatalogError(f"File not found: {uri}")
    except json.JSONDecodeError as e:
      raise CatalogError(f"Invalid JSON in {uri}: {e}")
    except URLError as e:
      raise CatalogError(f"Network error fetching {uri}: {e}")
    except Exception as e:
      raise CatalogError(f"Error fetching {uri}: {e}")

  def resolve_json_pointer(self, schema: Any, pointer: str) -> Any:
    """Resolves a JSON pointer against a schema."""
    # Normalize pointer and handle root cases
    clean_pointer = pointer.strip().lstrip("#")
    if not clean_pointer or clean_pointer == "/":
      return schema

    parts = clean_pointer.lstrip("/").split("/")
    current = schema
    try:
      for part in parts:
        # Handle RFC 6901 escaping
        part = part.replace("~1", "/").replace("~0", "~")
        if isinstance(current, list):
          current = current[int(part)]
        elif isinstance(current, dict):
          current = current[part]
        else:
          raise CatalogError(
            f"Cannot resolve pointer '{pointer}' through non-container type")
      return current
    except (KeyError, IndexError, ValueError) as e:
      raise CatalogError(f"Could not resolve pointer '{pointer}': {e}")

  def get_def_key(self, stem: str, pointer: str) -> str:
    """Generates a unique key for the $defs section.

    Derives the base name from the file stem and JSON pointer path,
    appending a numeric counter if a collision occurs.
    """
    parts = [p for p in pointer.split("/") if p and p != "#"]
    type_name = parts[-1] if parts else "root"

    clean_type_name = type_name.replace("#", "").lstrip("_")
    if not clean_type_name:
      clean_type_name = "root"

    base_key = f"{stem}_{clean_type_name}"
    final_key = base_key

    counter = 1
    while final_key in self.used_def_keys:
      final_key = f"{base_key}_{counter}"
      counter += 1

    self.used_def_keys.add(final_key)
    return final_key

  def _resolve_ref_uri(self, ref: str, current_base_uri: str) -> tuple[
    str, str, str]:
    """Resolves a $ref URI to a target URI, stem, and fragment.

    This method 'intercepts' well-known schemas like basic_catalog.json
    to ensure they use the correct versioned remote URL or local override.
    """
    parsed = urllib.parse.urlparse(ref)
    file_part = parsed.path
    fragment = parsed.fragment or ""

    target_name = Path(file_part).name

    # Centralized mapping for intercepted core schemas
    intercept_map = {
        "basic_catalog.json": (self.local_basic_catalog_path,
                               BASIC_CATALOG_URLS, "basic_catalog"),
        "common_types.json": (self.local_common_types_path, COMMON_TYPES_URLS,
                              "common_types"),
    }

    intercept_data = intercept_map.get(target_name)
    if intercept_data:
      local_path, remote_urls, stem = intercept_data
      target_uri = str(Path(local_path).resolve()) if local_path else \
      remote_urls[self.version]
      return target_uri, stem, fragment

    if is_remote_uri(current_base_uri):
      if is_remote_uri(ref):
        target_uri = urllib.parse.urldefrag(ref)[0]
      else:
        target_uri = urllib.parse.urljoin(current_base_uri, file_part)
      stem = Path(urllib.parse.urlparse(target_uri).path).stem
    else:
      target_path = (Path(current_base_uri).parent / file_part).resolve()
      target_uri = str(target_path)
      stem = target_path.stem

    return target_uri, stem, fragment

  def _process_ref(self, schema: dict, current_base_uri: str,
      depth: int) -> None:
    """Resolves an external $ref and updates the schema in place to use a local $defs reference."""
    ref = schema["$ref"]
    if ref.startswith("#"):
      return  # Is already a local reference, skip

    target_uri, stem, fragment = self._resolve_ref_uri(ref, current_base_uri)
    full_ref_id = f"{target_uri}#{fragment}"

    if full_ref_id in self.ref_mapping:
      schema["$ref"] = f"#/$defs/{self.ref_mapping[full_ref_id]}"
    else:
      file_data = self.fetch_json(target_uri)
      target_subschema = self.resolve_json_pointer(file_data, fragment)

      def_key = self.get_def_key(stem, fragment)
      self.ref_mapping[full_ref_id] = def_key

      # Recursively process the fetched subschema
      processed_sub = self.process_schema(
          copy.deepcopy(target_subschema), target_uri, depth + 1
      )
      self.definitions[def_key] = processed_sub
      schema["$ref"] = f"#/$defs/{def_key}"

  def process_schema(self, schema: Any, current_base_uri: str,
      depth: int = 0) -> Any:
    """Recursively processes a schema to flatten external $refs into $defs."""
    if depth > self.max_depth:
      raise CatalogError(
        f"Max recursion depth reached ({self.max_depth}) at {current_base_uri}. "
        "Check for circular $ref dependencies.")

    if isinstance(schema, dict):
      if "$ref" in schema:
        self._process_ref(schema, current_base_uri, depth)

      # Process remaining keys. In Draft 2020-12, $ref can have sibling keywords.
      for key, value in schema.items():
        if key != "$ref":
          schema[key] = self.process_schema(value, current_base_uri, depth)

    elif isinstance(schema, list):
      for i, item in enumerate(schema):
        schema[i] = self.process_schema(item, current_base_uri, depth)

    return schema

  def _merge_categories(self, source: dict, target: dict) -> None:
    """Merges components and functions from source catalog into target, warning on collisions."""
    for category in ["components", "functions"]:
      if category in source:
        for k, v in source[category].items():
          if k in target[category]:
            logger.warning(
              f"{category.title()[:-1]} collision: '{k}' already exists. Overwriting.")
          target[category][k] = v

  def assemble(self, name: str, input_uris: list[str],
      extend_basic: bool = False) -> dict:
    """Assembles multiple catalogs into one, optionally extending basic_catalog."""
    file_path = Path(name).with_suffix(".json")
    base_name = file_path.stem

    combined_catalog = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": file_path.name,
        "title": f"{base_name} A2UI Catalog",
        "description": f"{base_name} A2UI catalog, including {', '.join(Path(uri).stem for uri in input_uris)}.",
        "catalogId": file_path.name,
        "components": {},
        "functions": {}
    }

    uris_to_process = [str(uri) for uri in input_uris]
    if extend_basic:
      if self.local_basic_catalog_path:
        uris_to_process.append(
          str(Path(self.local_basic_catalog_path).resolve()))
      else:
        uris_to_process.append(BASIC_CATALOG_URLS[self.version])

    for uri in uris_to_process:
      base_uri = uri if is_remote_uri(uri) else str(Path(uri).resolve())

      data = self.fetch_json(base_uri)
      processed_data = self.process_schema(copy.deepcopy(data), base_uri)
      self._merge_categories(processed_data, combined_catalog)

    if self.definitions:
      combined_catalog["$defs"] = self.definitions

    return combined_catalog


def validate_catalog(catalog: dict):
  """Optional validation using jsonschema if available."""
  try:
    import jsonschema
    # Basic check to see if it's a valid JSON schema itself
    jsonschema.Draft202012Validator.check_schema(catalog)
    logger.info("✅ Catalog is a valid JSON schema (Draft 2020-12)")
  except ImportError:
    logger.debug("jsonschema not installed, skipping validation.")
  except Exception as e:
    logger.error(f"❌ Validation error: {e}")


def main():
  parser = argparse.ArgumentParser(
    description="Assemble multiple A2UI Catalogs into a single file.")
  # Note: inputs are kept as strings because they can be either local file paths
  # or remote URLs.
  parser.add_argument("inputs", nargs="+",
                      help="Input paths or URLs to A2UI component catalog JSONs")
  parser.add_argument("--name", required=True,
                      help="Name of the combined catalog")
  parser.add_argument("--version", choices=["0.9", "0.10"], default="0.9",
                      help="A2UI basic_catalog version to use if remote")
  parser.add_argument("--extend-basic-catalog", action="store_true",
                      help="Always include the entire basic_catalog.json in the output")
  parser.add_argument("--out-dir", "-o", type=Path, default="dist",
                      help="Output directory (default: dist)")
  parser.add_argument("--verbose", "-v", action="store_true",
                      help="Enable verbose logging")

  args = parser.parse_args()

  output_filename = Path(args.name).with_suffix(".json").name

  # Configure logging
  log_level = logging.DEBUG if args.verbose else logging.INFO
  logging.basicConfig(level=log_level, format="%(message)s")

  # Detect if any core catalogs (basic_catalog, common_types) are provided locally in the inputs list.
  # If found, these will be used to resolve $refs instead of the remote versioned URLs.
  local_basic_catalog_path = None
  local_common_types_path = None
  for inp in args.inputs:
    filename = Path(inp).name
    if filename == "basic_catalog.json":
      local_basic_catalog_path = inp
    elif filename == "common_types.json":
      local_common_types_path = inp

  logger.info(
    f"📦 Assembling {len(args.inputs)} catalogs into '{output_filename}' (Version: {args.version})")
  if args.extend_basic_catalog:
    logger.info("🔧 Extending with complete basic_catalog.json")

  try:
    assembler = CatalogAssembler(
        args.version,
        local_basic_catalog_path=local_basic_catalog_path,
        local_common_types_path=local_common_types_path
    )
    final_schema = assembler.assemble(output_filename, args.inputs,
                                      extend_basic=args.extend_basic_catalog)

    validate_catalog(final_schema)

    # Ensure out_dir is absolute relative to CWD so that mocks in tests work correctly.
    resolved_out_dir = Path.cwd() / args.out_dir
    resolved_out_dir.mkdir(parents=True, exist_ok=True)
    out_path = resolved_out_dir / output_filename

    out_path.write_text(json.dumps(final_schema, indent=2), encoding='utf-8')

    logger.info(f"✅ Created: {out_path}")
  except CatalogError as e:
    logger.error(f"❌ Error: {e}")
    sys.exit(1)
  except Exception as e:
    logger.error(f"❌ Unexpected error: {e}")
    if args.verbose:
      import traceback
      traceback.print_exc()
    sys.exit(1)


if __name__ == "__main__":
  main()
