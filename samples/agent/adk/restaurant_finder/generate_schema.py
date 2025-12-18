import json
from ui_schema import LLMOutput

if __name__ == "__main__":
    schema = LLMOutput.model_json_schema()
    print(json.dumps(schema, indent=2))
