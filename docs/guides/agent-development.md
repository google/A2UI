# Agent Development Guide

Build AI agents that generate A2UI interfaces. This guide covers generating and streaming UI messages from LLMs.

## Quick Overview

Building an A2UI agent:

1. **Understand user intent** → Decide what UI to show
2. **Generate A2UI JSON** → Use LLM structured output or prompts
3. **Validate & stream** → Check schema, send to client
4. **Handle actions** → Respond to user interactions

## Setup

**Python + ADK:**

```bash
pip install google-adk a2ui-extension
```

```python
from google.adk import Agent
from a2ui_extension import A2UIExtension

agent = Agent(name="MyAgent", extensions=[A2UIExtension()])

@agent.handle_message
async def handle_message(message: str, context):
    ui_messages = await generate_ui(message)
    for msg in ui_messages:
        yield msg
```

**Node.js + A2A:**

```bash
npm install @a2a/server
```

```javascript
import { A2AServer } from '@a2a/server';

const server = new A2AServer({name: 'MyAgent'});
server.onMessage(async (message) => {
  const uiMessages = await generateA2UI(message);
  for (const msg of uiMessages) {
    await server.sendArtifact({type: 'application/a2ui+jsonl', content: JSON.stringify(msg)});
  }
});
```

## Generating A2UI Messages

### Approach 1: Structured Output

Use LLM structured output (Gemini `response_schema`, OpenAI function calling):

```python
import google.generativeai as genai

model = genai.GenerativeModel('gemini-1.5-pro', generation_config={
    'response_mime_type': 'application/json',
    'response_schema': a2ui_schema  # Load from specification/0.8/json/server_to_client_with_standard_catalog.json
})

response = model.generate_content(f"Generate A2UI for: {user_message}")
ui_message = json.loads(response.text)
```

**Pros:** Guaranteed valid JSON, faster | **Cons:** Less flexible, model-specific

### Approach 2: Prompt-Based (Recommended)

Include schema/examples in prompt, validate after generation:

```python
SYSTEM_PROMPT = """Generate a sequence of A2UI JSON messages for user requests.
Messages are sent one per line.

Message types: surfaceUpdate, dataModelUpdate, beginRendering, deleteSurface

Example:
{"surfaceUpdate": {"surfaceId": "form", "components": [{"id": "root", "component": {"Column": {"children": {"explicitList": ["greeting"]}}}}, {"id": "greeting", "component": {"Text": {"text": {"literalString": "Hello!"}}}}]}}
{"beginRendering": {"surfaceId": "form", "root": "root"}}
"""

def generate_ui(user_message: str) -> list:
    response = model.generate_content(f"{SYSTEM_PROMPT}\n\nUser: {user_message}")
    return [json.loads(line) for line in response.text.strip().split('\n') if line.strip()]
```

**Pros:** Flexible, works with any LLM | **Cons:** Requires validation

## Validation

Always validate messages before sending:

```python
import jsonschema

with open('specification/0.8/json/server_to_client_with_standard_catalog.json') as f:
    schema = json.load(f)

def validate_message(message: dict) -> tuple[bool, str]:
    try:
        jsonschema.validate(instance=message, schema=schema)
        return True, None
    except jsonschema.ValidationError as e:
        return False, str(e)
```

For self-correction, send validation errors back to the LLM and ask it to fix.

## Streaming A2UI Messages

A2UI is designed to be streamed. By sending messages incrementally, the client can render UI progressively, which creates a much better user experience. A sequence of JSON messages can be streamed using a format like JSON Lines (JSONL), often over a transport like Server-Sent Events (SSE).

```python
async def stream_ui(user_message: str):
    # First, send the component structure
    yield {"surfaceUpdate": {"surfaceId": "main", "components": [
        {"id": "root", "component": {"Column": {"children": {"explicitList": ["title"]}}}},
        {"id": "title", "component": {"Text": {"text": {"literalString": "Response"}}}}
    ]}}
    # Then, tell the client it's ready to render
    yield {"beginRendering": {"surfaceId": "main", "root": "root"}}

    prompt = f"Generate A2UI component updates for: {user_message}"
    response_stream = model.generate_content(prompt, stream=True)
    buffer = ""
    for chunk in response_stream:
        buffer += chunk.text
        lines = buffer.split('\n')
        buffer = lines[-1]

        for line in lines[:-1]:
            if line.strip():
                msg = json.loads(line)
                if validate_message(msg)[0]:
                    # Stream subsequent updates
                    yield msg
```

## Handling User Actions

```python
@agent.handle_action
async def handle_action(action: dict, context):
    if action['name'] == 'submit_form':
        form_data = context.get_data_model(action['surfaceId'])
        # Process and respond with UI update
        yield {"surfaceUpdate": {"surfaceId": action['surfaceId'], "components": [{...}]}}
```

## Best Practices

1. **Progressive disclosure**: Send `surfaceUpdate` messages to define components, then `beginRendering` to show the UI, and `dataModelUpdate` to populate it with data.
2. **Separate structure from data**: Use path bindings, not hardcoded literals
3. **Descriptive IDs**: Use `"user-profile-card"` not `"comp1"`
4. **Handle errors**: Show error UI instead of crashing

## Complete Example

```python
from google.adk import Agent
from a2ui_extension import A2UIExtension
import google.generativeai as genai
import json

agent = Agent(name="RestaurantAgent", extensions=[A2UIExtension()])
model = genai.GenerativeModel('gemini-1.5-pro')

@agent.handle_message
async def handle_message(message: str, context):
    # 1. Send initial components and signal to render
    yield {"surfaceUpdate": {"surfaceId": "main", "components": [
        {"id": "root", "component": {"Column": {"children": {"explicitList": ["title"]}}}},
        {"id": "title", "component": {"Text": {"text": {"literalString": "Restaurant Finder"}}}}
    ]}}
    yield {"beginRendering": {"surfaceId": "main", "root": "root"}}

    # 2. Ask the LLM to generate the rest of the UI
    prompt = f"Generate a sequence of A2UI JSON messages for a restaurant booking flow. User said: {message}"
    response = model.generate_content(prompt)

    # 3. Stream the LLM's response to the client
    for line in response.text.strip().split('\n'):
        if line.strip():
            yield json.loads(line)

@agent.handle_action
async def handle_action(action: dict, context):
    # 4. Handle a user action
    if action['name'] == 'confirm_booking':
        # Respond with a UI update
        yield {
            "surfaceUpdate": {
                "surfaceId": action['surfaceId'],
                "components": [{
                    "id": "confirmation",
                    "component": {
                        "Text": {
                            "text": {"literalString": "Confirmed!"}
                        }
                    }
                }]
            }
        }

if __name__ == '__main__':
    agent.serve(port=8000)
```

## Next Steps

- **[Message Reference](../reference/messages.md)**: Full A2UI specification
- **[Component Gallery](../reference/components.md)**: See all available components
- **[Custom Components](custom-components.md)**: Extend the component catalog
- **[Sample Agents](https://github.com/google/a2ui/tree/main/samples/agent)**: Real-world examples
