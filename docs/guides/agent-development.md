# Agent Development Guide

Learn how to build AI agents that generate rich, interactive A2UI interfaces. This guide covers the complete workflow from understanding user intent to generating and validating UI messages.

## Overview

Building an A2UI agent involves:

1. **Understanding user intent** (via LLM)
2. **Deciding what UI to show** (planning the interface)
3. **Generating A2UI messages** (structured output or prompt-based)
4. **Streaming messages** to the client
5. **Handling user actions** (responding to interactions)
6. **Validating and correcting** errors

## The Agent Development Loop

```
┌──────────────────────────────────────────────────────────┐
│                    User Input                            │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│  1. Understand Intent (LLM)                              │
│     "What does the user want?"                           │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│  2. Plan UI (Agent Logic)                                │
│     "What interface should I show?"                      │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│  3. Generate A2UI JSON (LLM + Schema)                    │
│     createSurface, updateComponents, updateDataModel     │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│  4. Validate Messages (Schema Check)                     │
│     Does it match the A2UI protocol?                     │
└────────┬───────────────────────────┬────────────────────┘
         │                           │
    ❌ Invalid                  ✅ Valid
         │                           │
         ▼                           ▼
┌─────────────────┐         ┌──────────────────┐
│ 5a. Fix Errors  │         │ 5b. Stream to    │
│ (Ask LLM to     │         │     Client       │
│  correct)       │         └──────────────────┘
└─────────────────┘
```

## Step 1: Setting Up Your Agent

### Option A: Using Python + Google ADK

The Google Agent Development Kit (ADK) provides helpers for building A2UI agents.

**Installation:**

```bash
pip install google-adk a2ui-extension
```

**Basic Agent:**

```python
from google.adk import Agent
from a2ui_extension import A2UIExtension

# Create agent with A2UI support
agent = Agent(
    name="MyAgent",
    description="An agent that generates UI",
    extensions=[A2UIExtension()]
)

@agent.handle_message
async def handle_message(message: str, context):
    # Generate A2UI response
    ui_messages = await generate_ui(message, context)

    # Stream messages to client
    for msg in ui_messages:
        yield msg
```

### Option B: Using Node.js + A2A SDK

```javascript
import { A2AServer } from '@a2a/server';
import { generateA2UI } from './a2ui-generator';

const server = new A2AServer({
  name: 'MyAgent',
  description: 'An agent that generates UI'
});

server.onMessage(async (message) => {
  const uiMessages = await generateA2UI(message);

  for (const msg of uiMessages) {
    await server.sendArtifact({
      type: 'application/a2ui+jsonl',
      content: JSON.stringify(msg)
    });
  }
});

server.listen(3000);
```

## Step 2: Generating A2UI Messages

There are two approaches to generating A2UI JSON:

### Approach A: Structured Output (v0.8 Compatible)

Use LLM structured output capabilities (e.g., Gemini's `response_schema` or OpenAI's function calling).

**Example with Gemini:**

```python
import google.generativeai as genai

# Load A2UI schema
with open('server_to_client.json') as f:
    a2ui_schema = json.load(f)

# Configure model with schema
model = genai.GenerativeModel(
    'gemini-1.5-pro',
    generation_config={
        'response_mime_type': 'application/json',
        'response_schema': a2ui_schema
    }
)

# Generate UI
response = model.generate_content(
    f"Generate an A2UI interface for: {user_message}"
)

ui_message = json.loads(response.text)
```

**Pros:**

- ✅ Guaranteed valid JSON structure
- ✅ Faster generation (model is schema-constrained)

**Cons:**

- ❌ Limited to models with structured output support
- ❌ Less flexible (must fit schema exactly)

### Approach B: Prompt-First (v0.9 Recommended)

Embed the A2UI schema and examples in the prompt, let the LLM generate freeform JSON, then validate.

**Example Prompt Template:**

```python
SYSTEM_PROMPT = """
You are an agent that generates A2UI interfaces. A2UI is a JSON-based protocol
for describing user interfaces.

## A2UI Message Types

1. createSurface - Initialize a new UI surface
2. updateComponents - Add or update UI components
3. updateDataModel - Update application data
4. deleteSurface - Remove a surface

## Example: Creating a Form

{
  "createSurface": {
    "surfaceId": "form",
    "title": "User Form"
  }
}

{
  "updateComponents": {
    "surfaceId": "form",
    "components": [
      {
        "id": "name-field",
        "TextField": {
          "label": {"literal": "Name"},
          "value": {"path": "/form/name"}
        }
      },
      {
        "id": "submit-btn",
        "Button": {
          "text": {"literal": "Submit"},
          "onClick": {"actionId": "submit_form"}
        }
      }
    ]
  }
}

## Your Task

Generate A2UI messages (one per line, JSONL format) for the user's request.
Each line must be valid JSON. Do not include explanations, only JSON.
"""

def generate_ui(user_message: str) -> list:
    prompt = f"{SYSTEM_PROMPT}\n\nUser request: {user_message}\n\nA2UI JSONL:"

    response = model.generate_content(prompt)

    # Parse JSONL response
    messages = []
    for line in response.text.strip().split('\n'):
        if line.strip():
            try:
                msg = json.loads(line)
                messages.append(msg)
            except json.JSONDecodeError as e:
                print(f"Invalid JSON: {line}")

    return messages
```

**Pros:**

- ✅ More flexible, easier to extend
- ✅ Works with any LLM
- ✅ Can generate creative, complex UIs

**Cons:**

- ❌ Requires validation and error handling
- ❌ May generate invalid JSON (needs retry logic)

## Step 3: Providing Schema and Examples

To help the LLM generate valid A2UI, include:

### 1. The Protocol Schema

Include the A2UI schema in your prompt or as a reference:

```python
with open('specification/0.9/json/server_to_client.json') as f:
    schema = json.load(f)

# Option 1: Include full schema in prompt (can be large)
prompt += f"\n\nSchema:\n{json.dumps(schema, indent=2)}"

# Option 2: Include schema summary
prompt += """
Available Components:
- Text: Display text
- Button: Interactive button
- TextField: Text input
- Card: Container with styling
- Row/Column: Layout containers
... (etc)
"""
```

### 2. Component Examples

Provide examples of common UI patterns:

```python
EXAMPLES = """
## Example: Search Form

{"createSurface": {"surfaceId": "search", "title": "Search"}}
{"updateComponents": {
  "surfaceId": "search",
  "components": [
    {
      "id": "search-field",
      "TextField": {
        "label": {"literal": "Search query"},
        "value": {"path": "/query"}
      }
    },
    {
      "id": "search-btn",
      "Button": {
        "text": {"literal": "Search"},
        "onClick": {"actionId": "perform_search"}
      }
    }
  ]
}}

## Example: Results List

{"updateComponents": {
  "surfaceId": "search",
  "components": [
    {
      "id": "results",
      "Column": {
        "children": {
          "path": "/results",
          "componentId": "result-item"
        }
      }
    },
    {
      "id": "result-item",
      "Card": {
        "children": {"array": ["result-title", "result-desc"]}
      }
    },
    {
      "id": "result-title",
      "Text": {
        "text": {"path": "/title"},
        "style": "headline"
      }
    },
    {
      "id": "result-desc",
      "Text": {
        "text": {"path": "/description"}
      }
    }
  ]
}}
{"updateDataModel": {
  "surfaceId": "search",
  "op": "replace",
  "path": "/results",
  "value": [
    {"title": "Result 1", "description": "First result"},
    {"title": "Result 2", "description": "Second result"}
  ]
}}
"""
```

## Step 4: Validation and Error Handling

Always validate generated A2UI messages before sending to the client.

### Schema Validation

```python
import jsonschema

# Load schema
with open('specification/0.9/json/server_to_client.json') as f:
    schema = json.load(f)

def validate_message(message: dict) -> tuple[bool, str]:
    try:
        jsonschema.validate(instance=message, schema=schema)
        return True, None
    except jsonschema.ValidationError as e:
        return False, str(e)

# Validate before sending
for msg in generated_messages:
    valid, error = validate_message(msg)
    if not valid:
        print(f"Validation failed: {error}")
        # Ask LLM to fix the error
        fixed_msg = ask_llm_to_fix(msg, error)
        msg = fixed_msg
```

### Self-Correction Loop

If the LLM generates invalid JSON, ask it to correct:

```python
def ask_llm_to_fix(invalid_msg: dict, error: str) -> dict:
    correction_prompt = f"""
The following A2UI message failed validation:

{json.dumps(invalid_msg, indent=2)}

Error: {error}

Please generate a corrected version of this message that matches the A2UI schema.
Return only the corrected JSON, no explanation.
"""

    response = model.generate_content(correction_prompt)

    try:
        corrected = json.loads(response.text)
        valid, new_error = validate_message(corrected)
        if valid:
            return corrected
        else:
            # Retry logic (limit to 3 attempts)
            ...
    except json.JSONDecodeError:
        # Retry logic
        ...
```

## Step 5: Streaming Messages

Send messages incrementally for better UX:

```python
async def stream_ui(user_message: str):
    # 1. Create surface first
    yield {"createSurface": {"surfaceId": "main", "title": "Response"}}

    # 2. Generate UI incrementally
    prompt = build_prompt(user_message)
    response_stream = model.generate_content(prompt, stream=True)

    buffer = ""
    for chunk in response_stream:
        buffer += chunk.text

        # Try to parse complete JSON lines
        lines = buffer.split('\n')
        buffer = lines[-1]  # Keep incomplete line in buffer

        for line in lines[:-1]:
            if line.strip():
                try:
                    msg = json.loads(line)
                    valid, error = validate_message(msg)
                    if valid:
                        yield msg
                    else:
                        print(f"Invalid: {error}")
                except json.JSONDecodeError:
                    continue
```

## Step 6: Handling User Actions

When users interact with the UI, handle their actions:

```python
@agent.handle_action
async def handle_action(action: dict, context):
    """
    action = {
        "surfaceId": "main",
        "actionId": "submit_form",
        "data": {...}
    }
    """

    if action['actionId'] == 'submit_form':
        # Process form data
        form_data = context.get_data_model(action['surfaceId'])

        # Update UI to show confirmation
        yield {
            "updateComponents": {
                "surfaceId": action['surfaceId'],
                "components": [
                    {
                        "id": "confirmation",
                        "Text": {
                            "text": {"literal": "Form submitted successfully!"}
                        }
                    }
                ]
            }
        }
```

## Best Practices

### 1. Progressive Disclosure

Don't generate the entire UI at once. Build it progressively:

```python
# ✅ Good: Progressive disclosure
yield {"createSurface": {...}}          # Surface first
yield {"updateComponents": [...]}       # Structure next
yield {"updateDataModel": {...}}        # Data last

# ❌ Bad: Everything at once
yield {"createSurface": {...}, "components": [...], "data": {...}}
```

### 2. Separate Structure from Data

```python
# ✅ Good: Reusable structure
yield {"updateComponents": {
    "components": [
        {"id": "name", "Text": {"text": {"path": "/user/name"}}}
    ]
}}
yield {"updateDataModel": {
    "op": "replace",
    "path": "/user/name",
    "value": "Alice"
}}

# ❌ Bad: Hardcoded data
yield {"updateComponents": {
    "components": [
        {"id": "name", "Text": {"text": {"literal": "Alice"}}}
    ]
}}
```

### 3. Use Descriptive IDs

```python
# ✅ Good
{"id": "user-profile-card"}
{"id": "submit-payment-button"}

# ❌ Bad
{"id": "comp1"}
{"id": "btn2"}
```

### 4. Handle Errors Gracefully

```python
try:
    messages = generate_ui(user_input)
except Exception as e:
    # Show error UI instead of crashing
    yield {
        "updateComponents": {
            "surfaceId": "main",
            "components": [{
                "id": "error",
                "Text": {
                    "text": {"literal": "Sorry, I encountered an error. Please try again."}
                }
            }]
        }
    }
```

## Example: Complete Agent

Here's a complete minimal agent:

```python
from google.adk import Agent
from a2ui_extension import A2UIExtension
import google.generativeai as genai
import json

agent = Agent(
    name="RestaurantAgent",
    description="Find and book restaurants",
    extensions=[A2UIExtension()]
)

model = genai.GenerativeModel('gemini-1.5-pro')

@agent.handle_message
async def handle_message(message: str, context):
    # 1. Create surface
    yield {
        "createSurface": {
            "surfaceId": "main",
            "title": "Restaurant Finder"
        }
    }

    # 2. Generate UI
    prompt = f"""
Generate A2UI for a restaurant booking form.
User request: {message}

Return JSONL messages (updateComponents, updateDataModel).
"""

    response = model.generate_content(prompt)

    # 3. Parse and validate
    for line in response.text.strip().split('\n'):
        if line.strip():
            msg = json.loads(line)
            # (Validation omitted for brevity)
            yield msg

@agent.handle_action
async def handle_action(action: dict, context):
    if action['actionId'] == 'confirm_booking':
        # Process booking
        yield {
            "updateComponents": {
                "surfaceId": action['surfaceId'],
                "components": [{
                    "id": "confirmation",
                    "Text": {"text": {"literal": "Booking confirmed!"}}
                }]
            }
        }

if __name__ == '__main__':
    agent.serve(port=8000)
```

## Next Steps

- **[Protocol Reference](../reference/protocol.md)**: Full A2UI specification
- **[Component Gallery](../reference/components.md)**: See all available components
- **[Custom Components](custom-components.md)**: Extend the component catalog
- **[Sample Agents](https://github.com/google/a2ui/tree/main/samples/agent)**: Real-world examples
