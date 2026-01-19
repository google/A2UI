# LangGraph Restaurant Finder Agent

This directory contains a sample implementation of the Restaurant Finder agent using [LangGraph](https://github.com/langchain-ai/langgraph) and `a2ui`.

## Prerequisites

- Python 3.13+
- A Google Gemini API Key

## Setup

1.  **Install Dependencies**:
    ```bash
    # You may need to install the local a2ui package first if not available in PyPI
    pip install -e ../../../../a2a_agents/python/a2ui_extension

    # Install other dependencies
    pip install -r <(sed -n '/dependencies = \[/,/\]/p' pyproject.toml | sed '1d;$d' | tr -d '" ,' | sed 's/^//')
    # OR using uv
    # uv run .
    ```

2.  **Environment Variables**:
    Create a `.env` file in this directory (or rename `.env.example` -> `.env`) and add your API key:
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```

## Running the Server

Run the agent server:

```bash
python __main__.py
```

The server will start on `http://localhost:10002`.

## Using with A2UI Client

Detailed instructions for running the client are in the root `README.md` or `samples/client/lit/shell`.
Generally:
1.  Navigate to `samples/client/lit/shell`.
2.  `npm run dev`.
3.  Open the client in the browser.
4.  Interact with the Restaurant Agent.

## Implementation Details

-   `agent.py`: Defines the LangGraph agent, state, and tools.
-   `agent_executor.py`: Adapts the LangGraph agent to the A2A server interface.
-   `tools.py`: Contains the `search_restaurants` tool logic.
