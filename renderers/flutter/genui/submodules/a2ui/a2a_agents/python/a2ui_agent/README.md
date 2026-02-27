# A2UI Agent implementation

The `a2a_agents/python/a2ui_agent/` is the Python implementation of the a2ui agent library.

### Extension components (`src/a2ui/extension`)

The `src/a2ui/extension` directory contains the core logic for the A2UI agent extension:

*   **`a2ui_extension.py`**: Core utilities for extension management and A2UI part handling.
*   **`a2ui_schema_utils.py`**: Schema manipulation helpers.
*   **`send_a2ui_to_client_toolset.py`**: An example implementation of using ADK toolcalls to implement A2UI.

## Running tests

1. Navigate to the a2ui_agent dir:

   ```bash
   cd a2a_agents/python/a2ui_agent
   ```

2. Run the tests

   ```bash
   uv run --with pytest pytest tests/
   ```

## Building the SDK

To build the SDK, run the following command from the `a2a_agents/python/a2ui_agent` directory:

```bash
uv build .
```

## Disclaimer

Important: The sample code provided is for demonstration purposes and illustrates the mechanics of A2UI and the Agent-to-Agent (A2A) protocol. When building production applications, it is critical to treat any agent operating outside of your direct control as a potentially untrusted entity.

All operational data received from an external agent—including its AgentCard, messages, artifacts, and task statuses—should be handled as untrusted input. For example, a malicious agent could provide crafted data in its fields (e.g., name, skills.description) that, if used without sanitization to construct prompts for a Large Language Model (LLM), could expose your application to prompt injection attacks.

Similarly, any UI definition or data stream received must be treated as untrusted. Malicious agents could attempt to spoof legitimate interfaces to deceive users (phishing), inject malicious scripts via property values (XSS), or generate excessive layout complexity to degrade client performance (DoS). If your application supports optional embedded content (such as iframes or web views), additional care must be taken to prevent exposure to malicious external sites.

Developer Responsibility: Failure to properly validate data and strictly sandbox rendered content can introduce severe vulnerabilities. Developers are responsible for implementing appropriate security measures—such as input sanitization, Content Security Policies (CSP), strict isolation for optional embedded content, and secure credential handling—to protect their systems and users.
