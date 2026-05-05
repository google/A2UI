# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Solvers for A2UI evaluation."""

from inspect_ai.solver import Solver, solver, TaskState, Generate
from inspect_ai.model import ChatMessageSystem
from a2ui.schema.manager import A2uiSchemaManager
from a2ui.schema.catalog import CatalogConfig

@solver
def a2ui_system_prompt(schema_path: str, catalog_path: str) -> Solver:
    """Solver to inject A2UI schema and catalog into the system prompt using SDK.

    Args:
        schema_path: Path to the schema file (ignored, loaded from SDK).
        catalog_path: Path to the component catalog file.

    Returns:
        An Inspect Solver that injects the system prompt.
    """
    
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
