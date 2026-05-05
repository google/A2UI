import pytest
from a2ui_eval.scorers import a2ui_schema_scorer, a2ui_semantic_scorer
from inspect_ai.scorer import Target
from inspect_ai.solver import TaskState
from inspect_ai.model import ModelOutput, ModelName

@pytest.mark.asyncio
async def test_schema_scorer_valid_json():
    scorer = a2ui_schema_scorer()
    valid_json = """
    {
      "version": "v0.9",
      "createSurface": {
        "surfaceId": "main",
        "catalogId": "mycompany.com:somecatalog"
      }
    }
    """
    state = TaskState(
        model=ModelName("mock/model"),
        sample_id=1,
        epoch=1,
        input="test",
        messages=[],
        output=ModelOutput(model="mock/model", completion=valid_json)
    )
    
    score = await scorer(state, Target(""))
    assert score.value == 1.0
    assert "Valid schema" in score.explanation

@pytest.mark.asyncio
async def test_schema_scorer_valid_json_with_fences():
    scorer = a2ui_schema_scorer()
    valid_json = """
    ```json
    {
      "version": "v0.9",
      "createSurface": {
        "surfaceId": "main",
        "catalogId": "mycompany.com:somecatalog"
      }
    }
    ```
    """
    state = TaskState(
        model=ModelName("mock/model"),
        sample_id=1,
        epoch=1,
        input="test",
        messages=[],
        output=ModelOutput(model="mock/model", completion=valid_json)
    )
    
    score = await scorer(state, Target(""))
    assert score.value == 1.0
    assert "Valid schema" in score.explanation

@pytest.mark.asyncio
async def test_schema_scorer_invalid_json():
    scorer = a2ui_schema_scorer()
    state = TaskState(
        model=ModelName("mock/model"),
        sample_id=1,
        epoch=1,
        input="test",
        messages=[],
        output=ModelOutput(model="mock/model", completion="invalid json")
    )
    score = await scorer(state, Target(""))
    assert score.value == 0.0
    assert "Invalid JSON" in score.explanation

@pytest.mark.asyncio
async def test_schema_scorer_invalid_schema():
    scorer = a2ui_schema_scorer()
    invalid_schema_json = """
    {
      "version": "v0.9",
      "createSurface": {
        "surfaceId": "main"
      }
    }
    """
    state = TaskState(
        model=ModelName("mock/model"),
        sample_id=1,
        epoch=1,
        input="test",
        messages=[],
        output=ModelOutput(model="mock/model", completion=invalid_schema_json)
    )
    score = await scorer(state, Target(""))
    assert score.value == 0.0
    assert "Schema validation failed" in score.explanation

@pytest.mark.asyncio
async def test_semantic_scorer_dummy():
    scorer = a2ui_semantic_scorer()
    state = TaskState(
        model=ModelName("mock/model"),
        sample_id=1,
        epoch=1,
        input="test",
        messages=[],
        output=ModelOutput(model="mock/model", completion="{}")
    )
    score = await scorer(state, Target(""))
    assert score.value == 1.0
    assert "Semantic checks passed" in score.explanation
