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

from a2a.server.apps import A2AStarletteApplication
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.tasks import InMemoryTaskStore
from a2ui.core.schema.constants import VERSION_0_8
from a2ui.core.schema.manager import A2uiSchemaManager, CatalogConfig
from agent import McpAppProxyAgent
from agent_executor import McpAppProxyAgentExecutor, get_a2ui_enabled, get_a2ui_catalog, get_a2ui_examples
from dotenv import load_dotenv
from google.adk.artifacts import InMemoryArtifactService
from google.adk.memory.in_memory_memory_service import InMemoryMemoryService
from google.adk.models.lite_llm import LiteLlm
from google.adk.runners import Runner
from google.adk.sessions.in_memory_session_service import InMemorySessionService
from google.adk.tools.tool_context import ToolContext
from mcp import ClientSession
from mcp.client.sse import sse_client
from starlette.middleware.cors import CORSMiddleware
import anyio
import click
import httpx
import logging
import os
import traceback
import urllib.parse

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MissingAPIKeyError(Exception):
  """Exception for missing API key."""


@click.command()
@click.option("--host", default="localhost")
@click.option("--port", default=10006)
def main(host, port):
  try:
    if not os.getenv("GOOGLE_GENAI_USE_VERTEXAI") == "TRUE":
      if not os.getenv("GEMINI_API_KEY"):
        raise MissingAPIKeyError(
            "GEMINI_API_KEY environment variable not set and GOOGLE_GENAI_USE_VERTEXAI"
            " is not TRUE."
        )

    lite_llm_model = os.getenv("LITELLM_MODEL", "gemini/gemini-2.5-flash")
    base_url = f"http://{host}:{port}"

    schema_manager = A2uiSchemaManager(
        VERSION_0_8,
        catalogs=[
            CatalogConfig.from_path(
                name="mcp_app_proxy",
                catalog_path="mcp_app_catalog.json",
            ),
        ],
        accepts_inline_catalogs=True,
    )

    # Define get_calculator_app tool in a way that the LlmAgent can use.
    async def get_calculator_app(tool_context: ToolContext):
      """Fetches the calculator app."""
      # Connect to the MCP server via SSE
      mcp_server_host = os.getenv("MCP_SERVER_HOST", "localhost")
      mcp_server_port = os.getenv("MCP_SERVER_PORT", "8000")
      sse_url = f"http://{mcp_server_host}:{mcp_server_port}/sse"

      try:
        async with sse_client(sse_url) as streams:
          async with ClientSession(streams[0], streams[1]) as session:
            await session.initialize()

            # Read the resource
            result = await session.read_resource("ui://calculator/app")

            # Package the resource as an A2UI message
            if result.contents and hasattr(result.contents[0], "text"):
              html_content = result.contents[0].text
              encoded_html = "url_encoded:" + urllib.parse.quote(html_content)
              messages = [
                  {
                      "beginRendering": {
                          "surfaceId": "calculator_surface",
                          "root": "calculator_app_root",
                      },
                  },
                  {
                      "surfaceUpdate": {
                          "surfaceId": "calculator_surface",
                          "components": [{
                              "id": "calculator_app_root",
                              "component": {
                                  "McpApp": {
                                      "content": {"literalString": encoded_html},
                                      "title": {"literalString": "Calculator"},
                                      "allowedTools": ["calculate"],
                                  }
                              },
                          }],
                      },
                  },
              ]
              tool_context.actions.skip_summarization = True
              return {"validated_a2ui_json": messages}
            else:
              logger.error("Failed to get text content from resource")
              return {"error": "Could not fetch calculator app content."}

      except Exception as e:
        logger.error(f"Error fetching calculator app: {e} {traceback.format_exc()}")
        return {"error": f"Failed to connect to MCP server or fetch app. Details: {e}"}

    async def calculate_via_mcp(operation: str, a: float, b: float):
      """Calculates via the MCP server's Calculate tool.

      Args:
          operation: The mathematical operation (e.g. 'add', 'subtract', 'multiply', 'divide').
          a: First operand.
          b: Second operand.
      """
      mcp_server_host = os.getenv("MCP_SERVER_HOST", "localhost")
      mcp_server_port = os.getenv("MCP_SERVER_PORT", "8000")
      sse_url = f"http://{mcp_server_host}:{mcp_server_port}/sse"

      try:
        async with sse_client(sse_url) as streams:
          async with ClientSession(streams[0], streams[1]) as session:
            await session.initialize()

            result = await session.call_tool(
                "calculate", arguments={"operation": operation, "a": a, "b": b}
            )

            if (
                result.content
                and len(result.content) > 0
                and hasattr(result.content[0], "text")
            ):
              return result.content[0].text
            return "No result text from MCP calculate tool."
      except Exception as e:
        logger.error(f"Error calling MCP calculate: {e} {traceback.format_exc()}")
        return f"Error connecting to MCP server: {e}"

    tools = [get_calculator_app, calculate_via_mcp]

    agent = McpAppProxyAgent(
        base_url=base_url,
        model=LiteLlm(model=lite_llm_model),
        schema_manager=schema_manager,
        a2ui_enabled_provider=get_a2ui_enabled,
        a2ui_catalog_provider=get_a2ui_catalog,
        a2ui_examples_provider=get_a2ui_examples,
        tools=tools,
    )

    runner = Runner(
        app_name=agent.name,
        agent=agent,
        artifact_service=InMemoryArtifactService(),
        session_service=InMemorySessionService(),
        memory_service=InMemoryMemoryService(),
    )

    agent_executor = McpAppProxyAgentExecutor(
        base_url=base_url,
        runner=runner,
        schema_manager=schema_manager,
    )

    request_handler = DefaultRequestHandler(
        agent_executor=agent_executor,
        task_store=InMemoryTaskStore(),
    )
    server = A2AStarletteApplication(
        agent_card=agent.get_agent_card(), http_handler=request_handler
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
