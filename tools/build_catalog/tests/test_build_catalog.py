import json
import pytest
from pathlib import Path

from build_catalog import SchemaBundler

def test_resolve_json_pointer():
    bundler = SchemaBundler()
    schema = {
        "definitions": {
            "User": {
                "type": "object"
            }
        },
        "list": ["a", "b"]
    }
    
    # Test valid resolutions
    assert bundler.resolve_json_pointer(schema, "/definitions/User") == {"type": "object"}
    assert bundler.resolve_json_pointer(schema, "/list/1") == "b"
    
    # Test root resolutions
    assert bundler.resolve_json_pointer(schema, "") == schema
    assert bundler.resolve_json_pointer(schema, "#") == schema
    
    # Test unescaping
    schema_with_escaped_keys = {
        "path/to/thing": "escaped slash",
        "path~to~thing": "escaped tilde"
    }
    assert bundler.resolve_json_pointer(schema_with_escaped_keys, "/path~1to~1thing") == "escaped slash"
    assert bundler.resolve_json_pointer(schema_with_escaped_keys, "/path~0to~0thing") == "escaped tilde"

def test_resolve_json_pointer_error():
    bundler = SchemaBundler()
    schema = {"a": {"b": 1}}
    with pytest.raises(SystemExit):
        bundler.resolve_json_pointer(schema, "/a/c")
    with pytest.raises(SystemExit):
        bundler.resolve_json_pointer(schema, "/b")
    # Test indexing error
    with pytest.raises(SystemExit):
        bundler.resolve_json_pointer({"list": []}, "/list/0")

def test_get_def_key():
    bundler = SchemaBundler()
    assert bundler.get_def_key("path/to/target.json#/definitions/User", "myfile", "/definitions/User") == "myfile_definitions_User"
    assert bundler.get_def_key("path/to/target.json#1", "myfile", "") == "myfile_root"
    assert bundler.get_def_key("path/to/target.json#2", "myfile", "#") == "myfile_root"

def test_get_def_key_collision():
    bundler = SchemaBundler()
    bundler.ref_mapping["some_other_file.json#"] = "myfile_definitions_User"
    
    assert bundler.get_def_key("path/to/target.json#/definitions/User", "myfile", "/definitions/User") == "myfile_definitions_User_1"
    
    bundler.ref_mapping["yet_another_file.json#"] = "myfile_definitions_User_1"
    assert bundler.get_def_key("path/to/target.json#/definitions/User", "myfile", "/definitions/User") == "myfile_definitions_User_2"

def test_load_json_caching(tmp_path):
    # Setup dummy JSON file
    test_json_path = tmp_path / "test.json"
    test_json_path.write_text('{"hello": "world"}')
    
    bundler = SchemaBundler()
    
    # Load first time
    data1 = bundler.load_json(test_json_path)
    assert data1 == {"hello": "world"}
    
    # Modify file, but bundler should return cached version
    test_json_path.write_text('{"hello": "changed"}')
    data2 = bundler.load_json(test_json_path)
    assert data2 == {"hello": "world"}

def test_load_json_missing(tmp_path):
    bundler = SchemaBundler()
    with pytest.raises(SystemExit):
        bundler.load_json(tmp_path / "does_not_exist.json")

def test_process_schema_simple_ref(tmp_path):
    ext_path = tmp_path / "ext.json"
    ext_path.write_text('{"type": "string"}')
    
    main_schema = {
        "properties": {
            "name": {"$ref": "ext.json"}
        }
    }
    
    bundler = SchemaBundler()
    processed = bundler.process_schema(main_schema, tmp_path / "main.json")
    
    assert processed["properties"]["name"]["$ref"] == "#/$defs/ext_root"
    assert "ext_root" in bundler.definitions
    assert bundler.definitions["ext_root"] == {"type": "string"}

def test_process_schema_with_fragment(tmp_path):
    ext_path = tmp_path / "ext.json"
    ext_path.write_text('{"definitions": {"MyString": {"type": "string"}}}')
    
    main_schema = {
        "properties": {
            "name": {"$ref": "ext.json#/definitions/MyString"}
        }
    }
    
    bundler = SchemaBundler()
    processed = bundler.process_schema(main_schema, tmp_path / "main.json")
    
    assert processed["properties"]["name"]["$ref"] == "#/$defs/ext_definitions_MyString"
    assert "ext_definitions_MyString" in bundler.definitions
    assert bundler.definitions["ext_definitions_MyString"] == {"type": "string"}

def test_process_schema_caches_refs(tmp_path):
    ext_path = tmp_path / "ext.json"
    ext_path.write_text('{"type": "string"}')
    
    main_schema = {
        "prop1": {"$ref": "ext.json"},
        "prop2": {"$ref": "ext.json"}
    }
    
    bundler = SchemaBundler()
    processed = bundler.process_schema(main_schema, tmp_path / "main.json")
    
    assert processed["prop1"]["$ref"] == "#/$defs/ext_root"
    assert processed["prop2"]["$ref"] == "#/$defs/ext_root"
    assert len(bundler.definitions) == 1

def test_process_schema_recursive():
    bundler = SchemaBundler()
    schema = {
        "list": [{"a": 1}, {"b": 2}],
        "nested": {"c": 3}
    }
    processed = bundler.process_schema(schema, Path("dummy.json"))
    assert processed == {
        "list": [{"a": 1}, {"b": 2}],
        "nested": {"c": 3}
    }

def test_bundle_merges_defs(tmp_path):
    ext_path = tmp_path / "ext.json"
    ext_path.write_text('{"type": "string"}')
    
    main_path = tmp_path / "main.json"
    main_path.write_text('{"$defs": {"ExistingDef": {"type": "number"}}, "properties": {"a": {"$ref": "ext.json"}}}')
    
    bundler = SchemaBundler()
    final_schema = bundler.bundle(main_path)
    
    assert "$defs" in final_schema
    assert "ExistingDef" in final_schema["$defs"]
    assert "ext_root" in final_schema["$defs"]
    assert final_schema["$defs"]["ExistingDef"] == {"type": "number"}
    assert final_schema["$defs"]["ext_root"] == {"type": "string"}
    
    assert final_schema["properties"]["a"]["$ref"] == "#/$defs/ext_root"