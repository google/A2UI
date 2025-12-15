# Data Flow

How messages flow from agents to UI.

## Architecture

```
Agent (LLM) → A2UI Generator → Transport (SSE/WS/A2A)
                                      ↓
Client (Stream Reader) → Message Parser → Renderer → Native UI
```

## Message Format

A2UI defines a sequence of JSON messages that describe the UI. When streamed, these messages are often formatted as **JSON Lines (JSONL)**, where each line is a complete JSON object.

```jsonl
{"surfaceUpdate":{"surfaceId":"main","components":[...]}}
{"dataModelUpdate":{"surfaceId":"main","contents":[{"key":"user","valueMap":[{"key":"name","valueString":"Alice"}]}]}}
{"beginRendering":{"surfaceId":"main","root":"root-component"}}
```

**Why this format?** A sequence of self-contained JSON objects is streaming-friendly, easy for LLMs to generate incrementally, and resilient to errors.

## Lifecycle Example: Restaurant Booking

**1. User Input:** "Book a table for 2 tomorrow at 7pm"

**2. Agent streams components:** The agent sends the definitions for the UI components. Note the first `surfaceUpdate` for a `surfaceId` effectively creates the surface.

```json
{"surfaceUpdate": {"surfaceId": "booking", "components": [
  {"id": "root", "component": {"Column": {"children": {"explicitList": ["header", "guests-field", "datetime-field", "submit-btn"]}}}},
  {"id": "header", "component": {"Text": {"text": {"literalString": "Confirm Reservation"}, "usageHint": "h1"}}},
  {"id": "guests-field", "component": {"TextField": {"label": {"literalString": "Number of Guests"}, "text": {"path": "/reservation/guests"}}}},
  {"id": "datetime-field", "component": {"DateTimeInput": {"value": {"path": "/reservation/datetime"}, "enableDate": true, "enableTime": true}}},
  {"id": "submit-btn-text", "component": {"Text": {"text": {"literalString": "Confirm"}}}},
  {"id": "submit-btn", "component": {"Button": {"child": "submit-btn-text", "action": {"name": "confirm_reservation", "context": [{"key": "reservationDetails", "value": {"path": "/reservation"}}]}}}}
]}}
```

**3. Agent populates data:** The agent sends the data extracted from the user's prompt.

```json
{"dataModelUpdate": {"surfaceId": "booking", "path": "/reservation", "contents": [
  {"key": "datetime", "valueString": "2025-12-16T19:00:00Z"},
  {"key": "guests", "valueString": "2"}
]}}
```

**4. Agent signals to render:** The agent sends the `beginRendering` message, telling the client it has enough information to show the UI.

```json
{"beginRendering": {"surfaceId": "booking", "root": "root"}}
```
*The client now renders a form with the data pre-filled.*

**5. User interacts:** The user changes the number of guests to 3. The `TextField` is bound to `/reservation/guests`, so the client's data model is updated automatically. No message is sent to the agent yet.

**6. User submits:** The user clicks the "Confirm" button. The client sends a `userAction` message.

```json
{"userAction": {
  "name": "confirm_reservation",
  "surfaceId": "booking",
  "sourceComponentId": "submit-btn",
  "timestamp": "2025-12-15T20:01:00Z",
  "context": {
    "reservationDetails": {
      "datetime": "2025-12-16T19:00:00Z",
      "guests": "3"
    }
  }
}}
```

**7. Agent responds:** The agent processes the action and could respond with a confirmation message, for example by sending a new `surfaceUpdate` that replaces the form with a `Text` component.

**8. Clean up (optional):** After the flow is complete, the agent can send `{"deleteSurface": {"surfaceId": "booking"}}` to remove the UI.

## Transport Options

**SSE (Server-Sent Events):** Unidirectional HTTP streaming, most common for web
**WebSockets:** Bidirectional, real-time
**A2A Protocol:** Multi-agent systems, wrapped in artifacts
**HTTP Polling:** Simple but loses streaming benefits (not recommended)

## Progressive Rendering

**Traditional:** Wait 3s → Render complete UI all at once
**A2UI:** 0.2s surface → 0.5s header → 1.0s form → 1.5s fields → 2.0s data

Users see UI building in real-time instead of staring at a spinner.

## Error Handling

**Malformed messages:** Skip and continue, or send error back to agent for correction
**Network interruptions:** Display error state, reconnect, agent resends or resumes

## Performance

**Batching:** Buffer updates for 16ms, batch render together
**Diffing:** Compare old/new components, update only changed properties
**Granular updates:** Update `/user/name` not entire `/` model

## Next Steps

- **[Components & Structure](components.md)**: Learn about the adjacency list model
- **[Data Binding](data-binding.md)**: Understand how components bind to data
- **[Agent Development Guide](../guides/agent-development.md)**: Build agents that generate A2UI
