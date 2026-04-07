import os
import json
import yaml
import pytest
import jsonschema
import glob


def load_json_file(path):
    with open(path, "r") as f:
        return json.load(f)


def load_yaml_file(path):
    with open(path, "r") as f:
        return yaml.safe_load(f)


CONFORMANCE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SCHEMA_PATH = os.path.join(CONFORMANCE_DIR, "conformance_schema.json")
SCHEMA = load_json_file(SCHEMA_PATH)


def get_yaml_files():
    pattern = os.path.join(CONFORMANCE_DIR, "*.yaml")
    return glob.glob(pattern)


@pytest.mark.parametrize("yaml_path", get_yaml_files(), ids=os.path.basename)
def test_validate_conformance_yaml(yaml_path):
    yaml_data = load_yaml_file(yaml_path)
    basename = os.path.basename(yaml_path)
    try:
        jsonschema.validate(instance=yaml_data, schema=SCHEMA)
    except jsonschema.ValidationError as e:
        pytest.fail(f"{basename} failed schema validation: {e.message}")
