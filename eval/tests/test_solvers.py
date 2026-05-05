import pytest
from a2ui_eval.solvers import a2ui_system_prompt
from inspect_ai.solver import TaskState
from inspect_ai.model import ChatMessage, ModelName

@pytest.mark.asyncio
async def test_a2ui_system_prompt(tmp_path):
    schema_file = tmp_path / "schema.json"
    schema_file.write_text("schema content")
    catalog_file = tmp_path / "catalog.json"
    catalog_file.write_text("catalog content")
    
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
    assert "schema content" in state.messages[0].content
    assert "catalog content" in state.messages[0].content
