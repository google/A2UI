import pytest
import os
from a2ui_eval.solvers import a2ui_system_prompt
from inspect_ai.solver import TaskState
from inspect_ai.model import ChatMessage, ModelName

@pytest.mark.asyncio
async def test_a2ui_system_prompt(tmp_path):
    schema_file = tmp_path / "schema.json"
    schema_file.write_text("schema content") # Ignored by new implementation
    catalog_file = tmp_path / "catalog.json"
    # Write valid JSON catalog
    catalog_file.write_text('{"catalogId": "https://a2ui.org/test_catalog", "components": {}}')
    
    solver = a2ui_system_prompt(str(schema_file), str(catalog_file))
    
    state = TaskState(
        model=ModelName("mock/model"),
        sample_id=1,
        epoch=1,
        input="test",
        messages=[]
    )
    
    async def dummy_generate(state, **kwargs):
        return state
        
    state = await solver(state, dummy_generate)
    
    assert len(state.messages) == 1
    assert state.messages[0].role == "system"
    # Check if catalog ID is in the content (rendered by SDK)
    assert "https://a2ui.org/test_catalog" in state.messages[0].content

def test_a2ui_system_prompt_file_not_found():
    with pytest.raises(OSError): # SDK raises OSError/IOError
        a2ui_system_prompt("non_existent_schema.json", "non_existent_catalog.json")
