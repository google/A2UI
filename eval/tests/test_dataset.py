import os
import pytest
from a2ui_eval.dataset import load_a2ui_dataset

def test_load_a2ui_dataset(tmp_path):
    # Create a dummy YAML file
    d = tmp_path / "sub"
    d.mkdir()
    p = d / "dummy_prompts.yaml"
    p.write_text("""
- name: testPrompt
  description: A test prompt.
  promptText: "Test input"
""")
    
    dataset = load_a2ui_dataset(str(p))
    
    assert len(dataset) == 1
    assert dataset[0].input == "Test input"
    assert dataset[0].target == "A test prompt."
    assert dataset[0].metadata['name'] == "testPrompt"

def test_load_a2ui_dataset_file_not_found():
    with pytest.raises(FileNotFoundError):
        load_a2ui_dataset("non_existent_file.yaml")
