# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import logging
from typing import override

from a2a.server.agent_execution import RequestContext
from google.adk.agents.llm_agent import LlmAgent
from google.adk.artifacts import InMemoryArtifactService
from a2a.server.events.event_queue import EventQueue
from google.adk.memory.in_memory_memory_service import InMemoryMemoryService
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.a2a.executor.a2a_agent_executor import (
    A2aAgentExecutorConfig,
    A2aAgentExecutor,
)
from a2ui_ext import URI as A2UI_EXTENSION_URI
from a2a.types import AgentCapabilities, AgentCard, AgentExtension
from agent import STANDARD_CATALOG_URI

from agent import OrchestratorAgent
import part_converters

logger = logging.getLogger(__name__)


class OrchestratorAgentExecutor(A2aAgentExecutor):
    """Contact AgentExecutor Example."""

    def __init__(self, base_url: str, agent: LlmAgent):
        self._base_url = base_url
        
        config = A2aAgentExecutorConfig(
            gen_ai_part_converter=part_converters.convert_genai_part_to_a2a_part
        )

        runner = Runner(
            app_name=agent.name,
            agent=agent,
            artifact_service=InMemoryArtifactService(),
            session_service=InMemorySessionService(),
            memory_service=InMemoryMemoryService(),
        )

        super().__init__(runner=runner, config=config)


    def get_agent_card(self) -> AgentCard:
        return AgentCard(
            name="Orchestrator Agent",
            description="This agent orchestrates to multiple subagents to provide.",
            url=self._base_url,
            version="1.0.0",
            default_input_modes=OrchestratorAgent.SUPPORTED_CONTENT_TYPES,
            default_output_modes=OrchestratorAgent.SUPPORTED_CONTENT_TYPES,
            capabilities=AgentCapabilities(
                streaming=True,
                extensions=[
                    AgentExtension(
                        uri=self._base_url,
                        description="Provides a declarative a2ui UI JSON structure in messages.",
                        params={
                            "supportedCatalogUri": [
                                STANDARD_CATALOG_URI,
                            ],
                            "acceptsCustomCatalogsInline": True,
                        },
                    )
                ],
            ),            
            skills=[],
        )

    @override
    async def _handle_request(
        self,
        context: RequestContext,
        event_queue: EventQueue,
    ):
        # Always activate the extension for this sample.
        # if A2UI_EXTENSION_URI in context.requested_extensions:
        context.add_activated_extension(A2UI_EXTENSION_URI)
        
        # Note currently every message goes through the orchestrator agent, however you could bypass the orchestrator here and send A2UI messages directly to the subagent that created the surfaceId for better latency/reliability.
        
        await super()._handle_request(context, event_queue)
