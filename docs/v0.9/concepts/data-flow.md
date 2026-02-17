# Data Flow

How messages flow from agents to UI.

## Architecture

```
Agent (LLM) → A2UI Generator → Transport (SSE/WS/A2A)
                                      ↓
Client (Stream Reader) → Message Parser → Renderer → Native UI
```

![end-to-end-data-flow](../../assets/end-to-end-data-flow.png)

## Message Format

A2UI defines a sequence of JSON messages that describe the UI. When streamed, these messages are often formatted as **JSON Lines (JSONL)**, where each line is a complete JSON object.

```jsonl
{"version": "v0.9", "createSurface": {"surfaceId": "main", "catalogId": "..."}}
{"version": "v0.9", "updateComponents": {"surfaceId": "main", "components": [...]}}
{"version": "v0.9", "updateDataModel": {"surfaceId": "main", "value": {"user": "Alice"}}}
```

**Why this format?**

A sequence of self-contained JSON objects is streaming-friendly, easy for LLMs to generate incrementally, and resilient to errors.

## Lifecycle Example: Restaurant Booking

**User:** "Book a table for 2 tomorrow at 7pm"

**1. Agent signals render (v0.9 starts with creation):**

```json
{"version": "v0.9", "createSurface": {"surfaceId": "booking", "catalogId": "https://a2ui.org/specification/v0_9/standard_catalog.json"}}
```

**2. Agent defines UI structure:**

```json
{
  "version": "v0.9",
  "updateComponents": {
    "surfaceId": "booking",
    "components": [
      {"id": "root", "component": "Column", "children": ["header", "guests-field", "submit-btn"]},
      {"id": "header", "component": "Text", "text": "Confirm Reservation", "variant": "h1"},
      {"id": "guests-field", "component": "TextField", "label": "Guests", "value": {"path": "/reservation/guests"}},
      {"id": "submit-btn", "component": "Button", "child": "submit-text", "action": {"name": "confirm", "context": {"path": "/reservation"}}},
      {"id": "submit-text", "component": "Text", "text": "Confirm"}
    ]
  }
}
```

**3. Agent populates data:**

```json
{
  "version": "v0.9",
  "updateDataModel": {
    "surfaceId": "booking",
    "path": "/reservation",
    "value": {
      "datetime": "2025-12-16T19:00:00Z",
      "guests": 2
    }
  }
}
```

**4. User edits guests to "3"** → Client updates `/reservation/guests` automatically (no message to agent yet)

**5. User clicks "Confirm"** → Client sends action with updated data:

```json
{"action": {"name": "confirm", "surfaceId": "booking", "context": {"datetime": "2025-12-16T19:00:00Z", "guests": 3}}}
```

**6. Agent responds** → Updates UI or sends `{"version": "v0.9", "deleteSurface": {"surfaceId": "booking"}}` to clean up

## Transport Options

- **A2A Protocol**: Multi-agent systems, can also be used for agent to UI communication
- **AG UI**: Bidirectional, real-time
- ... others

See [transports](../transports.md) for more details.

## Progressive Rendering

Instead of waiting for the entire response to be generated before showing anything to the user, chunks of the response can be streamed to the client as they are generated and progressively rendered.

Users see UI building in real-time instead of staring at a spinner.

## Error Handling

- **Malformed messages:** Skip and continue, or send error back to agent for correction
- **Network interruptions:** Display error state, reconnect, agent resends or resumes

## Performance

- **Batching:** Buffer updates for 16ms, batch render together
- **Diffing:** Compare old/new components, update only changed properties
- **Granular updates:** Update `/user/name` not entire `/` model
