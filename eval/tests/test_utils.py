import pytest
from a2ui_eval.scorers import extract_json_from_markdown

def test_extract_json_from_markdown_no_fences():
    text = '{"key": "value"}'
    assert extract_json_from_markdown(text) == [{"key": "value"}]

def test_extract_json_from_markdown_with_json_tag():
    text = """
    ```json
    {"key": "value"}
    ```
    """
    assert extract_json_from_markdown(text) == [{"key": "value"}]

def test_extract_json_from_markdown_without_tag():
    text = """
    ```
    {"key": "value"}
    ```
    """
    assert extract_json_from_markdown(text) == [{"key": "value"}]

def test_extract_json_from_markdown_extra_whitespace():
    text = """
    
    ```json
    {"key": "value"}
    ```
    
    """
    assert extract_json_from_markdown(text) == [{"key": "value"}]

def test_extract_json_from_markdown_jsonl():
    text = """
    ```json
    {"key1": "value1"}
    {"key2": "value2"}
    ```
    """
    assert extract_json_from_markdown(text) == [{"key1": "value1"}, {"key2": "value2"}]

def test_extract_json_from_markdown_jsonl_no_fences():
    text = """
    {"key1": "value1"}
    {"key2": "value2"}
    """
    assert extract_json_from_markdown(text) == [{"key1": "value1"}, {"key2": "value2"}]
