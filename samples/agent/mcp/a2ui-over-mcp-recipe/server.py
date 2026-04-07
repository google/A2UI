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

from typing import Any
import anyio
import click
import pathlib
import jsonschema
import json
import mcp.types as types
from mcp.server.lowlevel import Server
from starlette.requests import Request
from a2ui.core.schema.manager import A2uiSchemaManager
from a2ui.core.schema.constants import VERSION_0_9
from a2ui.basic_catalog.provider import BasicCatalog



@click.command()
@click.option("--port", default=8000, help="Port to listen on for SSE")
@click.option(
    "--transport",
    type=click.Choice(["stdio", "sse"]),
    default="sse",
    help="Transport type",
)
def main(port: int, transport: str) -> int:
  # Initialize schema manager and validate sample
  schema_manager = A2uiSchemaManager(version=VERSION_0_9, catalogs=[BasicCatalog.get_config(version=VERSION_0_9)])
  selected_catalog = schema_manager.get_selected_catalog()
  
  recipe_a2ui_json = json.loads(
      (pathlib.Path(__file__).resolve().parent / "recipe_a2ui.json").read_text()
  )
  selected_catalog.validator.validate(recipe_a2ui_json)

  app = Server("a2ui-mcp-recipe-demo")

  @app.call_tool()
  async def handle_call_tool(name: str, arguments: dict[str, Any]) -> types.CallToolResult:
    if name == "get_recipe_a2ui":
      return types.CallToolResult(content=[
        types.TextContent(
          type="text",
          text="Here is the recipe UI."
        ), 
        types.EmbeddedResource(
          type="resource",
          resource=types.TextResourceContents(
              uri="a2ui://recipe-card",
              mimeType="application/json+a2ui",
              text=json.dumps(recipe_a2ui_json),
            )
      )])

    if name == "action":
      return types.CallToolResult(
          content=[
              types.TextContent(
                  type="text",
                  text=f"Received action {arguments.get('name')} with context {arguments.get('context')}"
              )
          ]
      )

    if name == "error":
      return types.CallToolResult(
          content=[
              types.TextContent(
                  type="text",
                  text=f"Received error {arguments.get('code')}: {arguments.get('message')}"
              )
          ]
      )

    raise ValueError(f"Unknown tool: {name}")

  @app.list_tools()
  async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="get_recipe_a2ui",
            title="Get Recipe A2UI",
            description="Returns the A2UI JSON to show a recipe as an Embedded Resource",
            inputSchema={"type": "object", "additionalProperties": False},
        ),
        types.Tool(
            name="action",
            title="A2UI Action",
            description="Handles A2UI user actions",
            inputSchema={
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "context": {"type": "object"}
                },
                "required": ["name"]
            },
        ),
        types.Tool(
            name="error",
            title="A2UI Error",
            description="Handles A2UI client errors",
            inputSchema={
                "type": "object",
                "properties": {
                    "code": {"type": "string"},
                    "message": {"type": "string"},
                    "surfaceId": {"type": "string"}
                },
                "required": ["code", "message"]
            },
        ),
    ]

  if transport == "sse":
    from mcp.server.sse import SseServerTransport
    from starlette.applications import Starlette
    from starlette.responses import Response
    from starlette.routing import Mount, Route
    from starlette.middleware import Middleware
    from starlette.middleware.cors import CORSMiddleware

    sse = SseServerTransport("/messages/")

    async def handle_sse(request: Request):
      async with sse.connect_sse(request.scope, request.receive, request._send) as streams:  # type: ignore[reportPrivateUsage]
        await app.run(streams[0], streams[1], app.create_initialization_options())
      return Response()

    starlette_app = Starlette(
        debug=True,
        routes=[
            Route("/sse", endpoint=handle_sse, methods=["GET"]),
            Mount("/messages/", app=sse.handle_post_message),
        ],
        middleware=[
            Middleware(
                CORSMiddleware,
                allow_origins=["*"],
                allow_methods=["*"],
                allow_headers=["*"],
            )
        ],
    )

    import uvicorn

    print(f"Server running at 127.0.0.1:{port} using sse")
    uvicorn.run(starlette_app, host="127.0.0.1", port=port)
  else:
    from mcp.server.stdio import stdio_server

    async def arun():
      async with stdio_server() as streams:
        await app.run(streams[0], streams[1], app.create_initialization_options())

    click.echo("Server running using stdio", err=True)
    anyio.run(arun)

  return 0
