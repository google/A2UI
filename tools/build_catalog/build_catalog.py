# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///

import argparse
import json
import hashlib
import sys
from pathlib import Path
from urllib.parse import urlparse

class SchemaBundler:
    def __init__(self):
        self.definitions = {}   # Stores the content of bundled schemas
        self.ref_mapping = {}   # Maps (abs_file_path + fragment) -> internal #/$defs/ key
        self.file_cache = {}    # Cache loaded JSON files to avoid re-reading

    def load_json(self, path: Path):
        path_str = str(path.resolve())
        if path_str in self.file_cache:
            return self.file_cache[path_str]
            
        if not path.exists():
            print(f"❌ Error: File not found: {path}")
            sys.exit(1)

        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            self.file_cache[path_str] = data
            return data

    def resolve_json_pointer(self, schema, pointer):
        """
        Navigates a JSON object using a JSON pointer (e.g., /definitions/User).
        """
        if not pointer or pointer == "#":
            return schema
            
        parts = pointer.lstrip("#/").split("/")
        current = schema
        try:
            for part in parts:
                # Unescape standard JSON pointer encoding (~1 -> /, ~0 -> ~)
                part = part.replace("~1", "/").replace("~0", "~")
                if isinstance(current, list):
                    current = current[int(part)]
                else:
                    current = current[part]
            return current
        except (KeyError, IndexError, ValueError):
            print(f"❌ Error: Could not resolve pointer '{pointer}'")
            sys.exit(1)

    def get_def_key(self, full_ref_id, file_stem, pointer):
        """Generates a clean, readable key for the $defs section."""
        # Clean up the pointer to make it a valid key (e.g., /definitions/User -> User)
        clean_pointer = pointer.replace("/", "_").replace("#", "").lstrip("_")
        if not clean_pointer:
            clean_pointer = "root"
            
        base_key = f"{file_stem}_{clean_pointer}"
        final_key = base_key
        
        # Prevent collisions for different references
        used_keys = set(self.ref_mapping.values())
        counter = 1
        while final_key in used_keys:
            final_key = f"{base_key}_{counter}"
            counter += 1
            
        return final_key

    def process_schema(self, schema, current_file_path: Path):
        """
        Recursively walks the schema. 
        If it finds a remote $ref, it loads it, extracts the target, 
        adds it to definitions, and rewrites the ref.
        """
        if isinstance(schema, dict):
            # 1. Handle $ref
            if "$ref" in schema:
                ref = schema["$ref"]
                
                # Check if it's an external reference (doesn't start with #)
                if not ref.startswith("#"):
                    # Parse URL to separate file path from fragment
                    parsed = urlparse(ref)
                    file_part = parsed.path
                    fragment = parsed.fragment or ""
                    
                    # Resolve absolute path to the target file
                    target_path = (current_file_path.parent / file_part).resolve()
                    
                    # Create a unique ID for this specific target (file + fragment)
                    full_ref_id = f"{target_path}#{fragment}"
                    
                    if full_ref_id in self.ref_mapping:
                        # We already bundled this, just point to it
                        schema["$ref"] = f"#/$defs/{self.ref_mapping[full_ref_id]}"
                    else:
                        # New reference: Load and Process
                        file_data = self.load_json(target_path)
                        
                        # Extract specific section if fragment exists
                        target_subschema = self.resolve_json_pointer(file_data, fragment)
                        
                        # Generate a key for $defs
                        def_key = self.get_def_key(full_ref_id, target_path.stem, fragment)
                        
                        # Store mapping immediately to handle recursion/cycles
                        self.ref_mapping[full_ref_id] = def_key
                        
                        # Recursively process the LOADED content (it might have its own refs!)
                        processed_sub = self.process_schema(target_subschema, target_path)
                        
                        self.definitions[def_key] = processed_sub
                        schema["$ref"] = f"#/$defs/{def_key}"

            # 2. Recursively process all other keys
            for key, value in schema.items():
                if key != "$ref":
                    schema[key] = self.process_schema(value, current_file_path)
                    
        elif isinstance(schema, list):
            for i, item in enumerate(schema):
                schema[i] = self.process_schema(item, current_file_path)
                
        return schema

    def bundle(self, input_path):
        # Resolve path to ensure absolute consistency
        abs_input = input_path.resolve()
        
        # Load and process (populates self.definitions)
        root_data = self.load_json(abs_input)
        processed_root = self.process_schema(root_data, abs_input)
        
        # --- Construct Final Ordered Dictionary ---
        final_schema = {}
        
        # 1. Add $defs FIRST
        existing_defs = processed_root.get("$defs", {})
        if existing_defs or self.definitions:
            merged_defs = {}
            # Combine existing $defs with bundled ones
            # (You can sort these keys if you want deterministic output)
            for k, v in existing_defs.items():
                merged_defs[k] = v
            for k, v in self.definitions.items():
                merged_defs[k] = v
            
            final_schema["$defs"] = merged_defs
            
        # 2. Add the rest of the schema properties
        for key, value in processed_root.items():
            if key != "$defs":
                final_schema[key] = value
                
        return final_schema

def main():
    parser = argparse.ArgumentParser(description="Bundle JSON Schema $refs into internal $defs.")
    parser.add_argument("input_file", type=Path, help="Input schema file")
    parser.add_argument("-o", "--output", type=Path, help="Output file")
    
    args = parser.parse_args()
    
    # Default output path logic
    output_path = args.output
    if not output_path:
        output_path = args.input_file.parent / "dist" / args.input_file.name

    print(f"📦 Bundling: {args.input_file}")
    
    bundler = SchemaBundler()
    final_schema = bundler.bundle(args.input_file)
    
    # Ensure directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(final_schema, f, indent=2)
        
    print(f"✅ Created:  {output_path}")

if __name__ == "__main__":
    main()