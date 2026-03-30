import logging
from typing import Any
import anyio
import click
import pathlib
import mcp.types as types
from mcp.server.lowlevel import Server

# Set up logging for the server (especially useful for SSE debugging)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mcp-basic-server")

@click.command()
@click.option("--port", default=8000, help="Port to listen on for SSE")
@click.option(
    "--transport",
    type=click.Choice(["stdio", "sse"]),
    default="sse",
    help="Transport type",
)
def main(port: int, transport: str) -> int:

    app = Server("mcp-apps-basic-server")

    @app.list_resources()
    async def list_resources() -> list[types.Resource]:
        return [
            types.Resource(
                uri="ui://basic/app",
                name="Basic App",
                mimeType="text/html;profile=mcp-app",
                description="A simple minimal application",
            )
        ]

    @app.read_resource()
    async def read_resource(uri: str) -> str | bytes:
        if str(uri) == "ui://basic/app":
            try:
                # Resolve the absolute path of apps/app.html
                app_path = pathlib.Path(__file__).parent / "apps" / "app.html"
                return app_path.read_text()
            except FileNotFoundError:
                raise ValueError(f"Resource file not found for uri: {uri} at {app_path}")
        raise ValueError(f"Unknown resource: {uri}")

    @app.list_tools()
    async def list_tools() -> list[types.Tool]:
        return [
            types.Tool(
                name="get_basic_app",
                title="Get Basic App",
                description="Returns a simple A2UI-compatible HTML application.",
                inputSchema={
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            ),
        ]

    @app.call_tool()
    async def handle_call_tool(name: str, arguments: dict[str, Any]) -> list[Any]:
        if name == "get_basic_app":
            # Just return a reference to the resource
            return [
                types.EmbeddedResource(
                    type="resource",
                    resource=types.TextResourceContents(
                        uri="ui://basic/app",
                        mimeType="text/html;profile=mcp-app",
                        text=""
                    )
                )
            ]

        raise ValueError(f"Unknown tool: {name}")

    if transport == "sse":
        from mcp.server.sse import SseServerTransport
        from starlette.applications import Starlette
        from starlette.requests import Request
        from starlette.responses import Response
        from starlette.routing import Mount, Route
        from starlette.middleware import Middleware
        from starlette.middleware.cors import CORSMiddleware
        import uvicorn

        sse = SseServerTransport("/messages/")

        async def handle_sse(request: Request):
            logger.info("New SSE Connection Request")
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

        logger.info(f"Server starting on 127.0.0.1:{port} using SSE")
        uvicorn.run(starlette_app, host="127.0.0.1", port=port)
    else:
        from mcp.server.stdio import stdio_server

        async def arun():
            async with stdio_server() as streams:
                await app.run(streams[0], streams[1], app.create_initialization_options())

        click.echo("Server running using stdio", err=True)
        anyio.run(arun)

    return 0

if __name__ == "__main__":
    main()
