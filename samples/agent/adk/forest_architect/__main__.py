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

"""Main entry point for the Forest Architect agent."""

import logging
import os

import click
from a2a.server.apps import A2AStarletteApplication
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.tasks import InMemoryTaskStore
from a2a.types import AgentCapabilities, AgentCard, AgentSkill
from a2ui.a2ui_extension import get_a2ui_agent_extension
from agent import ForestArchitectAgent
from agent_executor import ForestArchitectAgentExecutor
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MissingAPIKeyError(Exception):
    """Exception for missing API key."""


@click.command()
@click.option("--host", default="localhost")
@click.option("--port", default=10005)
def main(host, port):
    try:
        # Check for API key only if Vertex AI is not configured and not using Ollama
        litellm_model = os.getenv("LITELLM_MODEL", "")
        using_ollama = litellm_model.startswith("ollama/")
        if not os.getenv("GOOGLE_GENAI_USE_VERTEXAI") == "TRUE" and not using_ollama:
            if not os.getenv("GEMINI_API_KEY"):
                raise MissingAPIKeyError(
                    "GEMINI_API_KEY environment variable not set and GOOGLE_GENAI_USE_VERTEXAI is not TRUE."
                )

        capabilities = AgentCapabilities(
            streaming=True,
            extensions=[get_a2ui_agent_extension()],
        )

        skill_design = AgentSkill(
            id="design_forest",
            name="Design Micro-Forest",
            description="Design a micro-forest with budget and area specifications using the Miyawaki method.",
            tags=["forest", "design", "miyawaki", "plantation", "csr"],
            examples=[
                "Design a forest for 10,000 sq ft with ₹5 lakhs budget",
                "Create a micro-forest for our corporate campus",
                "Plan a plantation for 1 acre with 10 lakh budget",
            ],
        )

        skill_species = AgentSkill(
            id="recommend_species",
            name="Species Recommendations",
            description="Get recommendations for native species by forest layer.",
            tags=["species", "plants", "native", "recommendations"],
            examples=[
                "What canopy trees do you recommend?",
                "Show me native species for my forest",
                "What shrubs are best for sub-tropical climate?",
            ],
        )

        skill_proposal = AgentSkill(
            id="generate_proposal",
            name="Generate Proposal",
            description="Generate a formal proposal document for stakeholders.",
            tags=["proposal", "document", "csr", "stakeholders"],
            examples=[
                "Generate a proposal for ABC Corp",
                "Create a forest proposal for our housing society",
                "Make a CSR plantation proposal",
            ],
        )

        base_url = f"http://{host}:{port}"

        agent_card = AgentCard(
            name="Forest Architect Agent",
            description="Your AI-powered micro-forest design assistant! Design dense native forests using the Miyawaki method, calculate CO2 sequestration, and generate proposals for the Forests by Heartfulness initiative.",
            url=base_url,
            version="1.0.0",
            default_input_modes=ForestArchitectAgent.SUPPORTED_CONTENT_TYPES,
            default_output_modes=ForestArchitectAgent.SUPPORTED_CONTENT_TYPES,
            capabilities=capabilities,
            skills=[skill_design, skill_species, skill_proposal],
        )

        agent_executor = ForestArchitectAgentExecutor(base_url=base_url)

        request_handler = DefaultRequestHandler(
            agent_executor=agent_executor,
            task_store=InMemoryTaskStore(),
        )
        server = A2AStarletteApplication(
            agent_card=agent_card, http_handler=request_handler
        )
        import uvicorn

        app = server.build()

        app.add_middleware(
            CORSMiddleware,
            allow_origin_regex=r"http://localhost:\d+",
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        logger.info(f"🌳 Forest Architect Agent starting on {base_url}")
        logger.info(
            "🌿 Forests by Heartfulness - Designing the future, one tree at a time"
        )

        uvicorn.run(app, host=host, port=port)
    except MissingAPIKeyError as e:
        logger.error(f"Error: {e}")
        exit(1)
    except Exception as e:
        logger.error(f"An error occurred during server startup: {e}")
        exit(1)


if __name__ == "__main__":
    main()
