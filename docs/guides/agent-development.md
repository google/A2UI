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
    'response_schema': a2ui_schema  # Load from specification/0.9/json/server_to_client.json
})

response = model.generate_content(f"Generate A2UI for: {user_message}")
ui_message = json.loads(response.text)
```

**Pros:** Guaranteed valid JSON, faster | **Cons:** Less flexible, model-specific

### Approach 2: Prompt-Based (Recommended)

Include schema/examples in prompt, validate after generation:

```python
SYSTEM_PROMPT = """Generate A2UI JSONL for user requests.

Message types: createSurface, updateComponents, updateDataModel, deleteSurface

Example:
{"createSurface": {"surfaceId": "form", "title": "Form"}}
{"updateComponents": {"surfaceId": "form", "components": [...]}}
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

with open('specification/0.9/json/server_to_client.json') as f:
    schema = json.load(f)

def validate_message(message: dict) -> tuple[bool, str]:
    try:
        jsonschema.validate(instance=message, schema=schema)
        return True, None
    except jsonschema.ValidationError as e:
        return False, str(e)
```

For self-correction, send validation errors back to the LLM and ask it to fix.

## Streaming

Stream messages incrementally for better UX:

```python
async def stream_ui(user_message: str):
    yield {"createSurface": {"surfaceId": "main", "title": "Response"}}

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
                    yield msg
```

## Handling User Actions

```python
@agent.handle_action
async def handle_action(action: dict, context):
    if action['actionId'] == 'submit_form':
        form_data = context.get_data_model(action['surfaceId'])
        # Process and respond with UI update
        yield {"updateComponents": {...}}
```

## Best Practices

1. **Progressive disclosure**: Send createSurface, then updateComponents, then updateDataModel
2. **Separate structure from data**: Use path bindings, not hardcoded literals
3. **Descriptive IDs**: Use `"user-profile-card"` not `"comp1"`
4. **Handle errors**: Show error UI instead of crashing

## Complete Example

```python
from google.adk import Agent
from a2ui_extension import A2UIExtension
import google.generativeai as genai

agent = Agent(name="RestaurantAgent", extensions=[A2UIExtension()])
model = genai.GenerativeModel('gemini-1.5-pro')

@agent.handle_message
async def handle_message(message: str, context):
    yield {"createSurface": {"surfaceId": "main", "title": "Restaurant Finder"}}

    prompt = f"Generate A2UI JSONL for restaurant booking. User: {message}"
    response = model.generate_content(prompt)

    for line in response.text.strip().split('\n'):
        if line.strip():
            yield json.loads(line)

@agent.handle_action
async def handle_action(action: dict, context):
    if action['actionId'] == 'confirm_booking':
        yield {"updateComponents": {"surfaceId": action['surfaceId'],
               "components": [{"id": "confirmation", "Text": {"text": {"literal": "Confirmed!"}}}]}}

if __name__ == '__main__':
    agent.serve(port=8000)
```

## Next Steps

- **[Protocol Reference](../reference/protocol.md)**: Full A2UI specification
- **[Component Gallery](../reference/components.md)**: See all available components
- **[Custom Components](custom-components.md)**: Extend the component catalog
- **[Sample Agents](https://github.com/google/a2ui/tree/main/samples/agent)**: Real-world examples
