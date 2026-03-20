# Calculator MCP App Demo

A demo of an MCP server exposing a Calculator as an MCP Application Resource.

## Usage

1. Start the server using either stdio (default) or SSE transport:

```bash
# Using SSE transport (default) on port 8000
uv run .
```

The server exposes a resource named `ui://calculator/app`.

2. Inspect the server using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector)

```bash
npx @modelcontextprotocol/inspector
```

Connect to http://localhost:8000/sse using Transport Type SSE and fetch the resources.
