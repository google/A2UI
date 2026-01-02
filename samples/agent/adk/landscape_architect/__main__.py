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

"""Landscape Architect Agent - A2A server entry point."""

import logging
import os

import click
from a2a.server.apps import A2AStarletteApplication
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.tasks import InMemoryTaskStore
from a2a.types import AgentCapabilities, AgentCard, AgentSkill
from a2ui_ext import a2uiExtension
from agent import LandscapeArchitectAgent
from agent_executor import LandscapeArchitectExecutor
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MissingAPIKeyError(Exception):
    """Exception for missing API key."""


@click.command()
@click.option("--host", default="localhost")
@click.option("--port", default=10003, help="The port to bind to.")
@click.option(
    "--base-url",
    help="The public base URL for the agent card. Use when running on an Android emulator.",
)
def main(host: str, port: int, base_url: str | None):
    """Runs the Landscape Architect agent server."""
    try:
        # Check for API key only if Vertex AI is not configured
        if not os.getenv("GOOGLE_GENAI_USE_VERTEXAI") == "TRUE":
            if not os.getenv("GEMINI_API_KEY"):
                raise MissingAPIKeyError(
                    "GEMINI_API_KEY environment variable not set and GOOGLE_GENAI_USE_VERTEXAI is not TRUE."
                )

        a2ui_ext = a2uiExtension()
        capabilities = AgentCapabilities(
            streaming=True,
            extensions=[
                a2ui_ext.agent_extension(),
            ],
        )
        skill = AgentSkill(
            id="analyze_landscape",
            name="Landscape Photo Analyzer",
            description="Analyzes landscape photos and generates custom landscaping questionnaires.",
            tags=["landscape", "architect", "garden", "photo", "design"],
            examples=[
                "Analyze my backyard photo",
                "Help me redesign my garden",
                "What can I do with this outdoor space?",
            ],
        )

        if base_url is None:
            base_url = f"http://{host}:{port}"

        agent_card = AgentCard(
            name="Landscape Architect Agent",
            description="An AI-powered landscape architect that analyzes photos and generates custom landscaping forms.",
            url=base_url,
            version="1.0.0",
            default_input_modes=LandscapeArchitectAgent.SUPPORTED_CONTENT_TYPES,
            default_output_modes=LandscapeArchitectAgent.SUPPORTED_CONTENT_TYPES,
            capabilities=capabilities,
            skills=[skill],
        )

        agent_executor = LandscapeArchitectExecutor(base_url=base_url)
        agent_executor = a2ui_ext.wrap_executor(agent_executor)

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
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        # Create images directory if it doesn't exist
        images_dir = os.path.join(os.path.dirname(__file__), "images")
        os.makedirs(images_dir, exist_ok=True)
        os.makedirs(os.path.join(images_dir, "uploads"), exist_ok=True)

        app.mount("/images", StaticFiles(directory="images"), name="images")

        logger.info(f"Starting Landscape Architect Agent on {base_url}")
        uvicorn.run(app, host=host, port=port)
    except MissingAPIKeyError as e:
        logger.error(f"Error: {e}")
        exit(1)
    except Exception as e:
        logger.error(f"An error occurred during server startup: {e}")
        import traceback

        traceback.print_exc()
        exit(1)


if __name__ == "__main__":
    main()
