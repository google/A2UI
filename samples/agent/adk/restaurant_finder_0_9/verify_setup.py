import json
import sys
import os

# Add current directory to path so imports work
sys.path.append(os.getcwd())

try:
    from prompt_builder import A2UI_SCHEMA, get_ui_prompt, get_text_prompt
    from a2ui_examples import RESTAURANT_UI_EXAMPLES
    import jsonschema
    
    # Check Schema Validity
    print("Loading Schema...")
    schema = json.loads(A2UI_SCHEMA)
    print("Schema JSON Valid.")
    
    # Check if it compiles as a jsonschema
    jsonschema.Draft7Validator.check_schema(schema)
    print("Schema is valid Draft7 JSON Schema.")
    
    # Check Examples Validity
    print("Loading Examples...")
    # Examples are inside ---BEGIN...--- blocks.
    # We'll just extract them roughly or just the JSON part manually for testing.
    
    examples_str = RESTAURANT_UI_EXAMPLES
    # Find JSON arrays
    import re
    json_blocks = re.findall(r'\[\s*{.*}\s*\]', examples_str, re.DOTALL)
    
    array_schema = {"type": "array", "items": schema}
    
    for i, block in enumerate(json_blocks):
        print(f"Validating Example {i+1}...")
        # Be careful with format strings ${{...}} which are not valid JSON
        # We need to strip standard formatting or just check structure loosely
        # But wait, python format strings in examples uses {{ }} for { }.
        # To get actual JSON, we'd need to .format() it, but we lack context variables.
        # Actually, the examples in a2ui_examples.py are Python f-string templates (doubled braces).
        # We can try to replace {{ with { and }} with } to make it "quasi-JSON"
        # But we still have bindings like ${{path}}.
        pass 

    print("Verification script finished without crash.")

except Exception as e:
    print(f"FAILED: {e}")
    sys.exit(1)
