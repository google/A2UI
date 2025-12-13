# Data Flow

How messages flow from agents to UI.

## Architecture

```
Agent (LLM) → A2UI Generator → Transport (SSE/WS/A2A)
                                      ↓
Client (Stream Reader) → Message Parser → Renderer → Native UI
```

## Message Format: JSONL

A2UI uses JSON Lines (JSONL): one complete JSON object per line.

```jsonl
{"createSurface":{"surfaceId":"main","title":"App"}}
{"updateComponents":{"surfaceId":"main","components":[...]}}
{"updateDataModel":{"surfaceId":"main","op":"replace","path":"/","value":{...}}}
```

**Why JSONL?** Streaming-friendly, LLM-friendly, error-resilient, simple.

## Lifecycle Example: Restaurant Booking

**1. User Input:** "Book a table for 2 tomorrow at 7pm"

**2. Agent creates surface:**
```json
{"createSurface": {"surfaceId": "booking", "title": "Table Reservation"}}
```

**3. Agent streams components:**
```json
{"updateComponents": {"surfaceId": "booking", "components": [
  {"id": "header", "Text": {"text": {"literal": "Confirm Reservation"}, "style": "headline"}},
  {"id": "date-field", "DatePicker": {"value": {"path": "/reservation/date"}}},
  {"id": "time-field", "TimePicker": {"value": {"path": "/reservation/time"}}},
  {"id": "guests-field", "NumberInput": {"value": {"path": "/reservation/guests"}}},
  {"id": "submit", "Button": {"text": {"literal": "Confirm"}, "onClick": {"actionId": "confirm_reservation"}}}
]}}
```

**4. Agent populates data:**
```json
{"updateDataModel": {"surfaceId": "booking", "op": "replace", "path": "/reservation",
  "value": {"date": "2025-12-13", "time": "19:00", "guests": 2}}}
```

**5. User interacts:** Changes time to 8:00pm → Client sends data update to agent

**6. User submits:** Clicks "Confirm" button → Client sends `{"userAction": {"actionId": "confirm_reservation"}}`

**7. Agent responds:** Sends updateComponents with confirmation message

**8. Clean up (optional):** Agent sends `{"deleteSurface": {"surfaceId": "booking"}}`

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
