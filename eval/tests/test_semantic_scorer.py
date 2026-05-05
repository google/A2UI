import pytest
from a2ui_eval.scorers import a2ui_semantic_scorer
from inspect_ai.scorer import Target
from inspect_ai.solver import TaskState
from inspect_ai.model import ModelOutput, ModelName

@pytest.mark.asyncio
async def test_semantic_scorer_missing_root():
    scorer = a2ui_semantic_scorer()
    payload = """
    {
      "version": "v0.9",
      "updateComponents": {
        "surfaceId": "main",
        "components": [
          {"id": "not-root", "component": "Text", "properties": {"text": "Hello"}}
        ]
      }
    }
    """
    state = TaskState(
        model=ModelName("mock/model"),
        sample_id=1,
        epoch=1,
        input="test",
        messages=[],
        output=ModelOutput(model="mock/model", completion=payload)
    )
    score = await scorer(state, Target(""))
    assert score.value == 0.0
    assert "No component with id 'root' found" in score.explanation

@pytest.mark.asyncio
async def test_semantic_scorer_duplicate_ids():
    scorer = a2ui_semantic_scorer()
    payload = """
    {
      "version": "v0.9",
      "updateComponents": {
        "surfaceId": "main",
        "components": [
          {"id": "root", "component": "Column", "children": ["child1", "child2"]},
          {"id": "child1", "component": "Text", "properties": {"text": "1"}},
          {"id": "child1", "component": "Text", "properties": {"text": "2"}}
        ]
      }
    }
    """
    state = TaskState(
        model=ModelName("mock/model"),
        sample_id=1,
        epoch=1,
        input="test",
        messages=[],
        output=ModelOutput(model="mock/model", completion=payload)
    )
    score = await scorer(state, Target(""))
    assert score.value == 0.0
    assert "Duplicate component IDs found" in score.explanation

@pytest.mark.asyncio
async def test_semantic_scorer_broken_relationship():
    scorer = a2ui_semantic_scorer()
    payload = """
    {
      "version": "v0.9",
      "updateComponents": {
        "surfaceId": "main",
        "components": [
          {"id": "root", "component": "Column", "children": ["child1", "missing-child"]},
          {"id": "child1", "component": "Text", "properties": {"text": "1"}}
        ]
      }
    }
    """
    state = TaskState(
        model=ModelName("mock/model"),
        sample_id=1,
        epoch=1,
        input="test",
        messages=[],
        output=ModelOutput(model="mock/model", completion=payload)
    )
    score = await scorer(state, Target(""))
    assert score.value == 0.0
    assert "Referenced child ID 'missing-child' not found" in score.explanation

@pytest.mark.asyncio
async def test_semantic_scorer_circular_reference():
    scorer = a2ui_semantic_scorer()
    payload = """
    {
      "version": "v0.9",
      "updateComponents": {
        "surfaceId": "main",
        "components": [
          {"id": "root", "component": "Column", "children": ["nodeA"]},
          {"id": "nodeA", "component": "Row", "children": ["nodeB"]},
          {"id": "nodeB", "component": "Row", "children": ["nodeA"]}
        ]
      }
    }
    """
    state = TaskState(
        model=ModelName("mock/model"),
        sample_id=1,
        epoch=1,
        input="test",
        messages=[],
        output=ModelOutput(model="mock/model", completion=payload)
    )
    score = await scorer(state, Target(""))
    assert score.value == 0.0
    assert "Circular reference detected" in score.explanation

@pytest.mark.asyncio
async def test_semantic_scorer_valid():
    scorer = a2ui_semantic_scorer()
    payload = """
    {
      "version": "v0.9",
      "updateComponents": {
        "surfaceId": "main",
        "components": [
          {"id": "root", "component": "Column", "children": ["child1", "child2"]},
          {"id": "child1", "component": "Text", "properties": {"text": "1"}},
          {"id": "child2", "component": "Text", "properties": {"text": "2"}}
        ]
      }
    }
    """
    state = TaskState(
        model=ModelName("mock/model"),
        sample_id=1,
        epoch=1,
        input="test",
        messages=[],
        output=ModelOutput(model="mock/model", completion=payload)
    )
    score = await scorer(state, Target(""))
    assert score.value == 1.0
    assert "Semantic checks passed" in score.explanation

@pytest.mark.asyncio
async def test_semantic_scorer_skips_other_messages():
    scorer = a2ui_semantic_scorer()
    payload = """
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
        output=ModelOutput(model="mock/model", completion=payload)
    )
    score = await scorer(state, Target(""))
    assert score.value == 1.0
    assert "Semantic checks passed" in score.explanation
