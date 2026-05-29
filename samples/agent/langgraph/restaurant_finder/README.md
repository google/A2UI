# A2UI Restaurant finder and table reservation agent sample (LangGraph)

This sample uses [LangGraph](https://github.com/langchain-ai/langgraph) along with the A2A protocol to create a simple "Restaurant finder and table reservation" agent that is hosted as an A2A server.

## Prerequisites

- Python 3.10 or higher
- [UV](https://docs.astral.sh/uv/)
- Access to an LLM and API Key (Google Gemini is used by default)

## Running the Sample

1. Navigate to the samples directory:

    ```bash
    cd samples/agent/langgraph/restaurant_finder
    ```

2. Create an environment file with your API key:

    ```bash
    cp .env.example .env
    # Edit .env with your actual API key (do not commit .env)
    ```

3. Run the agent server:

    ```bash
    uv run .
    ```

## Implementation Details

-   `agent.py`: Defines the LangGraph agent, state, and tools.
-   `agent_executor.py`: Adapts the LangGraph agent to the A2A server interface.
-   `a2ui_examples.py`: Contains few-shot examples for A2UI generation.

## Disclaimer

Important: The sample code provided is for demonstration purposes and illustrates the mechanics of A2UI and the Agent-to-Agent (A2A) protocol. When building production applications, it is critical to treat any agent operating outside of your direct control as a potentially untrusted entity.

All operational data received from an external agent—including its AgentCard, messages, artifacts, and task statuses—should be handled as untrusted input. For example, a malicious agent could provide crafted data in its fields (e.g., name, skills.description) that, if used without sanitization to construct prompts for a Large Language Model (LLM), could expose your application to prompt injection attacks.

Similarly, any UI definition or data stream received must be treated as untrusted. Malicious agents could attempt to spoof legitimate interfaces to deceive users (phishing), inject malicious scripts via property values (XSS), or generate excessive layout complexity to degrade client performance (DoS). If your application supports optional embedded content (such as iframes or web views), additional care must be taken to prevent exposure to malicious external sites.

Developer Responsibility: Failure to properly validate data and strictly sandbox rendered content can introduce severe vulnerabilities. Developers are responsible for implementing appropriate security measures—such as input sanitization, Content Security Policies (CSP), strict isolation for optional embedded content, and secure credential handling—to protect their systems and users.
