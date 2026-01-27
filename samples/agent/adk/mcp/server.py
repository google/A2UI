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
from mcp.shared._httpx_utils import create_mcp_http_client
from starlette.requests import Request
from a2ui.extension.a2ui_schema_utils import wrap_as_json_array


def load_a2ui_schema() -> dict[str, Any]:
  current_dir = pathlib.Path(__file__).resolve().parent
  spec_root = current_dir / "../../../../specification/v0_8/json"

  server_to_client_content = (spec_root / "server_to_client.json").read_text()
  server_to_client_json = json.loads(server_to_client_content)

  standard_catalog_content = (
      spec_root / "standard_catalog_definition.json"
  ).read_text()
  standard_catalog_json = json.loads(standard_catalog_content)

  server_to_client_json["properties"]["surfaceUpdate"]["properties"]["components"][
      "items"
  ]["properties"]["component"]["properties"] = standard_catalog_json

  return wrap_as_json_array(server_to_client_json)


def load_a2ui_client_to_server_schema() -> dict[str, Any]:
  current_dir = pathlib.Path(__file__).resolve().parent
  spec_root = current_dir / "../../../../specification/v0_8/json"

  client_to_server_content = (spec_root / "client_to_server.json").read_text()
  client_to_server_json = json.loads(client_to_server_content)

  return client_to_server_json


@click.command()
@click.option("--port", default=8000, help="Port to listen on for SSE")
@click.option(
    "--transport",
    type=click.Choice(["stdio", "sse"]),
    default="sse",
    help="Transport type",
)
def main(port: int, transport: str) -> int:
  a2ui_schema = load_a2ui_schema()
  print(f"Loaded A2UI schema: {a2ui_schema}")

  recipe_a2ui_json = json.loads(
      (pathlib.Path(__file__).resolve().parent / "recipe_a2ui.json").read_text()
  )
  jsonschema.validate(instance=recipe_a2ui_json, schema=a2ui_schema)
  print(f"Loaded Recipe A2UI JSON: {recipe_a2ui_json}")

  a2ui_client_to_server_schema = load_a2ui_client_to_server_schema()
  print(f"Loaded A2UI client to server schema: {a2ui_client_to_server_schema}")

  app = Server("a2ui-over-mcp-demo")

  @app.call_tool()
  async def handle_call_tool(name: str, arguments: dict[str, Any]) -> dict[str, Any]:
    if name == "get_recipe_a2ui":
      return {"events": recipe_a2ui_json}

    if name == "send_a2ui_user_action":
      return {"response": f"Received A2UI user action", "args": arguments}

    if name == "send_a2ui_error":
      return {"response": f"Received A2UI error", "args": arguments}

    raise ValueError(f"Unknown tool: {name}")

  @app.list_tools()
  async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="get_recipe_a2ui",
            title="Get Recipe A2UI",
            description="Returns the A2UI JSON to show a recipe",
            inputSchema={"type": "object", "additionalProperties": False},
            # MCP throws an error for "type":"array" so wrapping in an object
            # TODO fix this in MCP SDK
            outputSchema={
                "type": "object",
                "properties": {"events": a2ui_schema},
                "required": ["events"],
                "additionalProperties": False,
            },
        ),
        types.Tool(
            name="send_a2ui_user_action",
            title="Send A2UI User Action",
            description="Sends an A2UI user action",
            inputSchema=a2ui_client_to_server_schema["properties"]["userAction"],
        ),
        types.Tool(
            name="send_a2ui_error",
            title="Send A2UI Error",
            description="Sends an A2UI error",
            inputSchema=a2ui_client_to_server_schema["properties"]["error"],
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
