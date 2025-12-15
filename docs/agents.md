# Agents (Server-Side)

Agents are server-side programs that generate A2UI messages in response to user requests.

## How Agents Work

```
User Input → Agent Logic → LLM → A2UI JSON → Send to Client
```

1. **Receive** user message
2. **Process** with LLM (Gemini, GPT, Claude, etc.)
3. **Generate** A2UI JSON messages
4. **Send** to client via transport

## Example Agents

The A2UI repository includes sample agents you can learn from:

| Agent | Description | Code |
|-------|-------------|------|
| **Restaurant Finder** | Table reservations with forms | [View](https://github.com/google/A2UI/tree/main/samples/agent/adk/restaurant_finder) |
| **Contact Lookup** | Search with result lists | [View](https://github.com/google/A2UI/tree/main/samples/agent/adk/contact_lookup) |
| **Rizzcharts** | Custom components demo | [View](https://github.com/google/A2UI/tree/main/samples/agent/adk/rizzcharts) |

## Agent Frameworks

You can build A2UI agents with any framework:

| Framework | Status | Notes |
|-----------|--------|-------|
| **A2A Protocol** | ✅ Supported | Native integration via extension |
| **ADK** | 📋 In Design | Sample implementations available |
| **Custom** | ✅ Supported | Use any LLM + JSON generation |

## Quick Example

```python
import google.generativeai as genai

# Include A2UI schema in prompt
prompt = """
Generate A2UI JSON for a booking form.
Use createSurface, updateComponents, updateDataModel.
"""

response = model.generate_content(prompt)

# Parse and stream to client
for line in response.text.split('\n'):
    if line.strip():
        yield json.loads(line)  # Stream JSONL
```

## Building an Agent

Key steps:

1. **Choose an LLM** (Gemini, GPT, Claude)
2. **Include A2UI schema** in prompts or use structured output
3. **Generate JSON messages** (JSONL format)
4. **Validate** against schema
5. **Stream** to clients

## Next Steps

- **[Agent Development Guide](guides/agent-development.md)**: Detailed how-to
- **[Quickstart](quickstart.md)**: Run the restaurant agent
- **[Specification](specification/v0.8-a2ui.md)**: Protocol details
