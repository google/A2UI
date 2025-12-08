# Onboarding Overview

Welcome to A2UI! This guide will help you get started with running sample agents and clients.

## Getting Started

To get started with A2UI, we recommend running a sample client and server to see them communicate. By default, they use the same port, so they should connect automatically.

You can choose between:
- **Flutter Client**: Supports macOS, iOS, and Android.
- **Lit Client**: Web-based client.

Once you have the samples running, you can start customizing them for your needs.

## Agent Server

We recommend working directly in a clone of the A2UI repository to set up an ADK server that depends on shared code.

### Example: Restaurant Finder Agent

We will use the "Restaurant Finder Agent" as our primary example.

1.  **Clone the Repository**:
    ```shell
    git clone git@github.com:google/A2UI.git
    cd A2UI/a2a_agents/python/adk/samples/restaurant_finder
    ```

2.  **Configure Environment**:
    Create an `.env` file with your API key:
    ```shell
    echo "GEMINI_API_KEY=your_api_key_here" > .env
    ```
    *Note: Use `GEMINI_API_KEY` for this setup.*

3.  **Run the Agent**:
    ```shell
    uv run .
    ```

## Next Steps

- Run `make quickstart` for a guided introduction.
- Run `make env-verify` to check your environment.
- Check the [Prerequisites](prerequisites.md) to ensure you have everything installed.
- See [Troubleshooting](troubleshooting.md) if you encounter issues.
