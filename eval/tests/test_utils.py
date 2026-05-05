import pytest
from a2ui_eval.scorers import _strip_markdown_fences

def test_strip_markdown_fences_no_fences():
    text = '{"key": "value"}'
    assert _strip_markdown_fences(text) == text

def test_strip_markdown_fences_with_json_tag():
    text = """
    ```json
    {"key": "value"}
    ```
    """
    assert _strip_markdown_fences(text) == '{"key": "value"}'

def test_strip_markdown_fences_without_tag():
    text = """
    ```
    {"key": "value"}
    ```
    """
    assert _strip_markdown_fences(text) == '{"key": "value"}'

def test_strip_markdown_fences_extra_whitespace():
    text = """
    
    ```json
    {"key": "value"}
    ```
    
    """
    assert _strip_markdown_fences(text) == '{"key": "value"}'
