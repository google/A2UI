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
    
    prompt = """You are an AI assistant. Based on the following request, generate a stream of JSON messages that conform to the provided JSON Schemas.
The output MUST be a series of JSON objects, each enclosed in a markdown code block (or a single block with multiple objects).

Standard Instructions:
1. Generate a 'createSurface' message with surfaceId 'main' and catalogId 'https://a2ui.org/specification/v0_9/basic_catalog.json'.
2. Generate a 'updateComponents' message with surfaceId 'main' containing the requested UI.
3. Ensure all component children are referenced by ID (using the 'children' or 'child' property with IDs), NOT nested inline as objects.
4. If the request involves data binding, you may also generate 'updateDataModel' messages.
5. Among the 'updateComponents' messages in the output, there MUST be one root component with id: 'root'.
6. Components need to be nested within a root layout container (Column, Row). No need to add an extra container if the root is already a layout container.
7. There shouldn't be any orphaned components: no components should be generated which don't have a parent, except for the root component.
8. Do NOT output a list of lists (e.g. [[...]]). Output individual JSON objects separated by newlines.
9. STRICTLY follow the JSON Schemas. Do NOT add any properties that are not defined in the schema. Ensure ALL required properties are present.
10. Do NOT invent data bindings or action contexts. Only use them if the prompt explicitly asks for them.
11. Read the 'description' field of each component in the schema carefully. It contains critical usage instructions.
12. Do NOT define components inline inside 'child' or 'children'. Always use a string ID referencing a separate component definition.
13. Do NOT use a 'style' property. Use standard properties like 'align', 'justify', 'variant', etc.
14. Do NOT invent properties that are not in the schema. Check the 'properties' list for each component type.
15. Use 'checks' property for validation rules if required.
16. EVERY message object MUST include the property "version": "v0.9" at the top level.

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
