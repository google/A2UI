# A2UI Contact Multiple Surfaces Agent Sample

This sample uses the Agent Development Kit (ADK) along with the A2A protocol to create a simple "Contact Lookup" agent that is hosted as an A2A server.

## Prerequisites

- Python 3.9 or higher
- [UV](https://docs.astral.sh/uv/)
- Access to an LLM and API Key

## Running the Sample

1. Navigate to the samples directory:

    ```bash
    cd samples/agent/adk/contact_multiple_surfaces
    ```

2. Create an environment file with your API key:

   ```bash
   echo "GEMINI_API_KEY=your_api_key_here" > .env
   ```

3. You will need two terminal tabs open in this directory to run both the persistent MCP Server and the A2UI Agent backend:

   **Terminal 1 (Floor Plan MCP Server):**
   ```bash
   uv run floor_plan_server.py
   ```
   *This hosts the custom `ui://` resources and the `chart_node_click` tools.*

   **Terminal 2 (Main A2UI Agent):**
   ```bash
   uv run .
   ```
   *This connects to the backend MCP Server and orchestrates the GenUI surface.*


## Disclaimer

Important: The sample code provided is for demonstration purposes and illustrates the mechanics of the Agent-to-Agent (A2A) protocol. When building production applications, it is critical to treat any agent operating outside of your direct control as a potentially untrusted entity.

All data received from an external agent—including but not limited to its AgentCard, messages, artifacts, and task statuses—should be handled as untrusted input. For example, a malicious agent could provide an AgentCard containing crafted data in its fields (e.g., description, name, skills.description). If this data is used without sanitization to construct prompts for a Large Language Model (LLM), it could expose your application to prompt injection attacks.  Failure to properly validate and sanitize this data before use can introduce security vulnerabilities into your application.

Developers are responsible for implementing appropriate security measures, such as input validation and secure handling of credentials to protect their systems and users.
