"""Solvers for A2UI evaluation."""

from inspect_ai.solver import Solver, solver, TaskState, Generate
from inspect_ai.model import ChatMessageSystem

@solver
def a2ui_system_prompt(schema_path: str, catalog_path: str) -> Solver:
    """Solver to inject A2UI schema and catalog into the system prompt."""
    
    def get_content(path):
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
            
    schema_content = get_content(schema_path)
    catalog_content = get_content(catalog_path)
    
    prompt = """You are an AI assistant generating user interfaces using the A2UI protocol.
You must respond ONLY with a valid JSON message conforming to the A2UI schema.

Here is the A2UI schema:
<SCHEMA_CONTENT>

Here is the available component catalog:
<CATALOG_CONTENT>
"""

    prompt = prompt.replace("<SCHEMA_CONTENT>", schema_content)
    prompt = prompt.replace("<CATALOG_CONTENT>", catalog_content)

    async def solve(state: TaskState, generate: Generate) -> TaskState:  # pylint: disable=unused-argument
        state.messages.insert(0, ChatMessageSystem(content=prompt))
        return state
        
    return solve
