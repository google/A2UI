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

import json
import logging
import os
from typing import List
from a2a.client import A2ACardResolver
from a2a.extensions.common import HTTP_EXTENSION_HEADER
from google.adk.models.lite_llm import LiteLlm
from google.adk.agents.llm_agent import LlmAgent
from google.adk.agents.remote_a2a_agent import RemoteA2aAgent, DEFAULT_TIMEOUT
from google.adk.planners.built_in_planner import BuiltInPlanner
from google.genai import types
import httpx
import re
import part_converters
from a2ui_ext import URI as A2UI_EXTENSION_URI

logger = logging.getLogger(__name__)

STANDARD_CATALOG_URI = "https://raw.githubusercontent.com/google/A2UI/refs/heads/main/specification/0.8/json/standard_catalog_definition.json"

class OrchestratorAgent:
    """An agent that runs an ecommerce dashboard"""

    SUPPORTED_CONTENT_TYPES = ["text", "text/plain"]
    
    @classmethod
    async def build_agent(cls, subagent_urls: List[str]) -> LlmAgent:
        """Builds the LLM agent for the orchestrator_agent agent."""

        subagents = []
        subagent_instructions = []
        for subagent_url in subagent_urls:
            async with httpx.AsyncClient() as httpx_client:
                resolver = A2ACardResolver(
                    httpx_client=httpx_client,
                    base_url=subagent_url,
                )
                
                subagent_card =  await resolver.get_agent_card()
                logger.info('Successfully fetched public agent card:' + subagent_card.model_dump_json(indent=2, exclude_none=True))
                
                # clean name for adk
                clean_name = re.sub(r'[^0-9a-zA-Z_]+', '_', subagent_card.name)                
                if clean_name == "":
                    clean_name = "_"
                if clean_name[0].isdigit():
                    clean_name = f"_{clean_name}"
                
                # make remote agent
                remote_a2a_agent = RemoteA2aAgent(
                    clean_name, 
                    subagent_card, 
                    a2a_part_converter=part_converters.convert_a2a_part_to_genai_part,  
                    httpx_client=httpx.AsyncClient(
                       timeout=httpx.Timeout(timeout=DEFAULT_TIMEOUT), 
                       headers={HTTP_EXTENSION_HEADER: A2UI_EXTENSION_URI}
                    ))                
                subagents.append(remote_a2a_agent)
                
                # make system instructions
                subagent_instruction = f"* Subagent {clean_name}: " + json.dumps({
                    "id": clean_name,
                    "name": subagent_card.name,
                    "description": subagent_card.description,
                    "skills": [
                        {
                            "name": skill.name, 
                            "description": skill.description, 
                            "examples": skill.examples, 
                            "tags": skill.tags
                        } for skill in subagent_card.skills
                    ]
                }, indent=2)
                subagent_instructions.append(subagent_instruction)

        instructions = f"""
You are an orchestrator agent. Your sole responsibility is to analyze the incoming user request, determine the user's intent, and route the task to exactly one of your expert subagents below.

{"\n\n".join(subagent_instructions)}
"""

        logger.info(f'Creating orchestrator agent with instructions: {instructions}')

        LITELLM_MODEL = os.getenv("LITELLM_MODEL", "gemini-2.5-flash")
        return LlmAgent(
            model=LiteLlm(model=LITELLM_MODEL),
            name="orchestrator_agent",
            description="An agent that orchestrates requests to multiple other agents",
            instruction=instructions,
            tools=[],
            planner=BuiltInPlanner(
                thinking_config=types.ThinkingConfig(
                    include_thoughts=True,
                )
            ),
            sub_agents=subagents,
        )
