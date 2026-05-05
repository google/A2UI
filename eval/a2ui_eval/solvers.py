"""Solvers for A2UI evaluation."""

from inspect_ai.solver import Solver, solver, TaskState, Generate
from inspect_ai.model import ChatMessageSystem
from a2ui.schema.manager import A2uiSchemaManager
from a2ui.schema.catalog import CatalogConfig

@solver
def a2ui_system_prompt(schema_path: str, catalog_path: str) -> Solver:
    """Solver to inject A2UI schema and catalog into the system prompt using SDK."""
    
    catalog_config = CatalogConfig.from_path("basic_catalog", catalog_path)
    manager = A2uiSchemaManager(version="0.9", catalogs=[catalog_config])
    
    workflow_override = """
Additional Rules:
1. Generate a 'createSurface' message with surfaceId 'main' and catalogId 'https://a2ui.org/specification/v0_9/basic_catalog.json'.
2. Generate a 'updateComponents' message with surfaceId 'main' containing the requested UI.
3. Among the 'updateComponents' messages in the output, there MUST be one root component with id: 'root'.
4. Ensure all component children are referenced by ID, NOT nested inline as objects.
"""

    prompt = manager.generate_system_prompt(
        role_description="You are an AI assistant. Based on the following request, generate a stream of JSON messages that conform to the provided JSON Schemas.",
        workflow_description=workflow_override,
        include_schema=True,
    )

    async def solve(state: TaskState, generate: Generate) -> TaskState:  # pylint: disable=unused-argument
        state.messages.insert(0, ChatMessageSystem(content=prompt))
        return state
        
    return solve
