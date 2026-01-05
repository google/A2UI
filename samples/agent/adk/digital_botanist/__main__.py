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
import os
from pathlib import Path

import click
from a2a.server.apps import A2AStarletteApplication
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.tasks import InMemoryTaskStore
from a2a.types import AgentCapabilities, AgentCard, AgentSkill
from a2ui.a2ui_extension import get_a2ui_agent_extension
from agent import BotanistAgent
from agent_executor import BotanistAgentExecutor
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Path to plant images (local assets folder)
ASSETS_DIR = Path(__file__).parent / "assets"


class MissingAPIKeyError(Exception):
    """Exception for missing API key."""


@click.command()
@click.option("--host", default="localhost")
@click.option("--port", default=10004)
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

        skill_search = AgentSkill(
            id="search_plants",
            name="Search Plants",
            description="Search for plants by name (common or scientific).",
            tags=["plants", "search", "botany", "garden"],
            examples=[
                "Find roses",
                "Search for palm trees",
                "Show me flowering shrubs",
            ],
        )

        skill_browse = AgentSkill(
            id="browse_categories",
            name="Browse Categories",
            description="Browse plant categories and explore plants in each category.",
            tags=["plants", "categories", "browse", "explore"],
            examples=[
                "What categories do you have?",
                "Show me palm varieties",
                "Browse flowering shrubs",
            ],
        )

        skill_details = AgentSkill(
            id="plant_details",
            name="Plant Details",
            description="Get detailed information about a specific plant.",
            tags=["plants", "details", "information"],
            examples=[
                "Tell me about Red Ginger",
                "What is the scientific name for Peacock Flower?",
            ],
        )

        base_url = f"http://{host}:{port}"

        agent_card = AgentCard(
            name="Digital Botanist Agent",
            description="Your AI-powered plant expert! Search, browse, and learn about over 9,500 plants from the HeartyHorticulture catalogue.",
            url=base_url,
            version="1.0.0",
            default_input_modes=BotanistAgent.SUPPORTED_CONTENT_TYPES,
            default_output_modes=BotanistAgent.SUPPORTED_CONTENT_TYPES,
            capabilities=capabilities,
            skills=[skill_search, skill_browse, skill_details],
        )

        agent_executor = BotanistAgentExecutor(base_url=base_url)

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

        # Mount the assets directory for serving plant images
        catalogue_dir = ASSETS_DIR / "heartyculture_catalogue"
        if catalogue_dir.exists():
            app.mount(
                "/heartyculture_catalogue",
                StaticFiles(directory=str(catalogue_dir)),
                name="catalogue",
            )
            logger.info(f"Mounted plant images from {catalogue_dir}")
        else:
            logger.warning(f"Plant catalogue directory not found: {catalogue_dir}")

        logger.info(f"🌱 Digital Botanist Agent starting on {base_url}")
        logger.info(f"📚 Plant database: {ASSETS_DIR / 'heartyculture_plants.json'}")

        uvicorn.run(app, host=host, port=port)
    except MissingAPIKeyError as e:
        logger.error(f"Error: {e}")
        exit(1)
    except Exception as e:
        logger.error(f"An error occurred during server startup: {e}")
        exit(1)


if __name__ == "__main__":
    main()
