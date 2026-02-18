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
import pathlib
import traceback

import click
from a2a.server.apps import A2AStarletteApplication
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.tasks import InMemoryTaskStore
from agent_executor import RizzchartsAgentExecutor, get_a2ui_enabled, get_a2ui_schema
from agent import RizzchartsAgent
from google.adk.artifacts import InMemoryArtifactService
from google.adk.memory.in_memory_memory_service import InMemoryMemoryService
from google.adk.models.lite_llm import LiteLlm
from google.adk.runners import Runner
from google.adk.sessions.in_memory_session_service import InMemorySessionService
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MissingAPIKeyError(Exception):
  """Exception for missing API key."""


@click.command()
@click.option("--host", default="localhost")
@click.option("--port", default=10002)
def main(host, port):
  try:
    # Check for API key only if Vertex AI is not configured
    if not os.getenv("GOOGLE_GENAI_USE_VERTEXAI") == "TRUE":
      if not os.getenv("GEMINI_API_KEY"):
        raise MissingAPIKeyError(
            "GEMINI_API_KEY environment variable not set and GOOGLE_GENAI_USE_VERTEXAI"
            " is not TRUE."
        )

    lite_llm_model = os.getenv("LITELLM_MODEL", "gemini/gemini-2.5-flash")
    agent = RizzchartsAgent(
        model=LiteLlm(model=lite_llm_model),
        a2ui_enabled_provider=get_a2ui_enabled,
        a2ui_schema_provider=get_a2ui_schema,
    )
    runner = Runner(
        app_name=agent.name,
        agent=agent,
        artifact_service=InMemoryArtifactService(),
        session_service=InMemorySessionService(),
        memory_service=InMemoryMemoryService(),
    )

    current_dir = pathlib.Path(__file__).resolve().parent
    spec_root = current_dir / "../../../../specification/v0_8/json"

    try:
      a2ui_schema_content = (spec_root / "server_to_client.json").read_text()
      standard_catalog_content = (
          spec_root / "standard_catalog_definition.json"
      ).read_text()
      rizzcharts_catalog_content = (
          current_dir / "rizzcharts_catalog_definition.json"
      ).read_text()
    except FileNotFoundError as e:
      logger.error(f"Failed to load required JSON files: {e}")
      exit(1)

    logger.info(f"Loaded schema from {spec_root}")

    base_url = f"http://{host}:{port}"
    agent_executor = RizzchartsAgentExecutor(
        base_url=base_url,
        runner=runner,
        a2ui_schema_content=a2ui_schema_content,
        standard_catalog_content=standard_catalog_content,
        rizzcharts_catalog_content=rizzcharts_catalog_content,
    )

    request_handler = DefaultRequestHandler(
        agent_executor=agent_executor,
        task_store=InMemoryTaskStore(),
    )
    server = A2AStarletteApplication(
        agent_card=agent_executor.get_agent_card(), http_handler=request_handler
    )
    import uvicorn

    app = server.build()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    uvicorn.run(app, host=host, port=port)
  except MissingAPIKeyError as e:
    logger.error(f"Error: {e} {traceback.format_exc()}")
    exit(1)
  except Exception as e:
    logger.error(
        f"An error occurred during server startup: {e} {traceback.format_exc()}"
    )
    exit(1)


if __name__ == "__main__":
  main()
