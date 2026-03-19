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
import mcp.types as types
from mcp.server.lowlevel import Server
from starlette.requests import Request


@click.command()
@click.option("--port", default=8000, help="Port to listen on for SSE")
@click.option(
    "--transport",
    type=click.Choice(["stdio", "sse"]),
    default="sse",
    help="Transport type",
)
def main(port: int, transport: str) -> int:

  app = Server("a2ui-mcp-calculator-demo")

  @app.list_resources()
  async def list_resources() -> list[types.Resource]:
    return [
        types.Resource(
            uri="ui://calculator/app",
            name="Calculator App",
            mimeType="text/html;profile=mcp-app",
            description="A simple calculator application",
        )
    ]

  @app.read_resource()
  async def read_resource(uri: types.ResourceIdentifier) -> str | bytes:
    if str(uri) == "ui://calculator/app":
      try:
        return (pathlib.Path(__file__).parent / "apps" / "calculator.html").read_text()
      except FileNotFoundError:
        raise ValueError(f"Resource file not found for uri: {uri}")
    raise ValueError(f"Unknown resource: {uri}")

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
