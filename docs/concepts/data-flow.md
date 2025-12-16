# Data Flow

How messages flow from agents to UI.

## Architecture

```
Agent (LLM) → A2UI Generator → Transport (SSE/WS/A2A)
                                      ↓
Client (Stream Reader) → Message Parser → Renderer → Native UI
```

![end-to-end-data-flow](../assets/end-to-end-data-flow.png)

## Message Format

A2UI defines a sequence of JSON messages that describe the UI. When streamed, these messages are often formatted as **JSON Lines (JSONL)**, where each line is a complete JSON object.

```jsonl
{"surfaceUpdate":{"surfaceId":"main","components":[...]}}
{"dataModelUpdate":{"surfaceId":"main","contents":[{"key":"user","valueMap":[{"key":"name","valueString":"Alice"}]}]}}
{"beginRendering":{"surfaceId":"main","root":"root-component"}}
```

**Why this format?** A sequence of self-contained JSON objects is streaming-friendly, easy for LLMs to generate incrementally, and resilient to errors.

## Lifecycle Example: Restaurant Booking

**User:** "Book a table for 2 tomorrow at 7pm"

**1. Agent defines UI structure:**

```json
{"surfaceUpdate": {"surfaceId": "booking", "components": [
  {"id": "root", "component": {"Column": {"children": {"explicitList": ["header", "guests-field", "submit-btn"]}}}},
  {"id": "header", "component": {"Text": {"text": {"literalString": "Confirm Reservation"}, "usageHint": "h1"}}},
  {"id": "guests-field", "component": {"TextField": {"label": {"literalString": "Guests"}, "text": {"path": "/reservation/guests"}}}},
  {"id": "submit-btn", "component": {"Button": {"child": "submit-text", "action": {"name": "confirm", "context": [{"key": "details", "value": {"path": "/reservation"}}]}}}}
]}}
```

**2. Agent populates data:**

```json
{"dataModelUpdate": {"surfaceId": "booking", "path": "/reservation", "contents": [
  {"key": "datetime", "valueString": "2025-12-16T19:00:00Z"},
  {"key": "guests", "valueString": "2"}
]}}
```

**3. Agent signals render:**

```json
{"beginRendering": {"surfaceId": "booking", "root": "root"}}
```

**4. User edits guests to "3"** → Client updates `/reservation/guests` automatically (no message to agent yet)

**5. User clicks "Confirm"** → Client sends action with updated data:

```json
{"userAction": {"name": "confirm", "surfaceId": "booking", "context": {"details": {"datetime": "2025-12-16T19:00:00Z", "guests": "3"}}}}
```

**6. Agent responds** → Updates UI or sends `{"deleteSurface": {"surfaceId": "booking"}}` to clean up

## Transport Options

- **A2A Protocol**: Multi-agent systems, can also be used for agent to UI communication
- **AG UI**: Bidirectional, real-time
- ... others

See [transports](../transports.md) for more details.

## Progressive Rendering

Instead of waiting for the entire response to be generated before showing anything to the user, chunks of the response can be streamed to the client as they are generated and progressively rendered.

Users see UI building in real-time instead of staring at a spinner.

## Error Handling

**Malformed messages:** Skip and continue, or send error back to agent for correction
**Network interruptions:** Display error state, reconnect, agent resends or resumes

## Performance

**Batching:** Buffer updates for 16ms, batch render together
**Diffing:** Compare old/new components, update only changed properties
**Granular updates:** Update `/user/name` not entire `/` model
