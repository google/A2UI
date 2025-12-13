# Data Flow

Understanding how messages flow through an A2UI system is crucial for building and debugging agent-driven interfaces. This guide walks through the complete lifecycle of an A2UI interaction.

## The Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Agent / Server                       │
│  ┌────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │    LLM     │───>│   A2UI      │───>│   Stream    │     │
│  │  (Gemini)  │    │  Generator  │    │   (SSE/WS)  │     │
│  └────────────┘    └─────────────┘    └─────────────┘     │
└─────────────────────────────────┬───────────────────────────┘
                                  │ JSONL Messages
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      Client Application                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │   Stream    │───>│   Message   │───>│   A2UI      │    │
│  │   Reader    │    │   Parser    │    │  Renderer   │    │
│  └─────────────┘    └─────────────┘    └─────────────┘    │
│                                               │             │
│                                               ▼             │
│                                      ┌─────────────┐        │
│                                      │  Native UI  │        │
│                                      │  (Angular/  │        │
│                                      │  Flutter/   │        │
│                                      │  React)     │        │
│                                      └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Message Stream Format

A2UI messages are sent as a **JSON Lines (JSONL)** stream. Each line is a complete, valid JSON object representing one message.

### Example Stream

```jsonl
{"createSurface":{"surfaceId":"main","title":"Restaurant Finder"}}
{"updateComponents":{"surfaceId":"main","components":[{"id":"header","Text":{"text":{"literal":"Welcome"}}}]}}
{"updateDataModel":{"surfaceId":"main","op":"replace","path":"/","value":{"user":"Alice"}}}
```

### Why JSONL?

- **Streaming-friendly**: Parse line by line without buffering the entire response
- **LLM-friendly**: Easy for LLMs to generate incrementally
- **Error-resilient**: One malformed message doesn't break the entire stream
- **Simple**: No complex framing protocol needed

## Complete Lifecycle Example

Let's walk through a complete user interaction with a restaurant booking agent.

### Step 1: User Sends Message

**User types:** "Book a table for 2 tomorrow at 7pm"

The client sends this to the agent via the A2A protocol (or another transport):

```json
{
  "type": "message",
  "content": "Book a table for 2 tomorrow at 7pm"
}
```

### Step 2: Agent Creates Surface

The agent decides to create a UI for the booking flow.

**Agent sends:**

```json
{
  "createSurface": {
    "surfaceId": "booking",
    "title": "Table Reservation"
  }
}
```

**Client receives:** Initializes a new surface container with ID "booking"

### Step 3: Agent Streams Components

The agent (via LLM) generates the UI components incrementally.

**Agent sends (message 1):**

```json
{
  "updateComponents": {
    "surfaceId": "booking",
    "components": [
      {
        "id": "header",
        "Text": {
          "text": {"literal": "Confirm Your Reservation"},
          "style": "headline"
        }
      }
    ]
  }
}
```

**Client receives:** Renders a headline text

**Agent sends (message 2):**

```json
{
  "updateComponents": {
    "surfaceId": "booking",
    "components": [
      {
        "id": "container",
        "Column": {
          "children": {"array": ["header", "form", "submit"]}
        }
      },
      {
        "id": "form",
        "Card": {
          "children": {"array": ["date-field", "time-field", "guests-field"]}
        }
      }
    ]
  }
}
```

**Client receives:** Updates the component tree with container and form structure

**Agent sends (message 3):**

```json
{
  "updateComponents": {
    "surfaceId": "booking",
    "components": [
      {
        "id": "date-field",
        "DatePicker": {
          "label": {"literal": "Date"},
          "value": {"path": "/reservation/date"}
        }
      },
      {
        "id": "time-field",
        "TimePicker": {
          "label": {"literal": "Time"},
          "value": {"path": "/reservation/time"}
        }
      },
      {
        "id": "guests-field",
        "NumberInput": {
          "label": {"literal": "Number of Guests"},
          "value": {"path": "/reservation/guests"}
        }
      },
      {
        "id": "submit",
        "Button": {
          "text": {"literal": "Confirm Booking"},
          "onClick": {"actionId": "confirm_reservation"}
        }
      }
    ]
  }
}
```

**Client receives:** Adds all form fields and button to the UI

### Step 4: Agent Populates Data

Now the agent sends data to pre-fill the form based on the user's request.

**Agent sends:**

```json
{
  "updateDataModel": {
    "surfaceId": "booking",
    "op": "replace",
    "path": "/reservation",
    "value": {
      "date": "2025-12-13",
      "time": "19:00",
      "guests": 2
    }
  }
}
```

**Client receives:** Updates the data model and the form fields reactively show the values

### Step 5: User Interacts

The user changes the time from 7:00pm to 8:00pm in the UI.

**Client sends to agent:**

```json
{
  "updateDataModel": {
    "surfaceId": "booking",
    "op": "replace",
    "path": "/reservation/time",
    "value": "20:00"
  }
}
```

### Step 6: User Submits

The user clicks the "Confirm Booking" button.

**Client sends to agent:**

```json
{
  "userAction": {
    "surfaceId": "booking",
    "actionId": "confirm_reservation"
  }
}
```

### Step 7: Agent Updates UI

The agent processes the booking and updates the UI to show confirmation.

**Agent sends:**

```json
{
  "updateComponents": {
    "surfaceId": "booking",
    "components": [
      {
        "id": "confirmation",
        "Card": {
          "children": {"array": ["success-icon", "success-message"]}
        }
      },
      {
        "id": "success-icon",
        "Icon": {
          "name": {"literal": "check_circle"},
          "color": {"literal": "green"}
        }
      },
      {
        "id": "success-message",
        "Text": {
          "text": {"literal": "Your table for 2 on December 13 at 8:00 PM is confirmed!"}
        }
      }
    ]
  }
}
```

**Client receives:** Updates the UI to show the confirmation message

### Step 8: Clean Up (Optional)

After a few seconds, the agent might remove the surface:

**Agent sends:**

```json
{
  "deleteSurface": {
    "surfaceId": "booking"
  }
}
```

**Client receives:** Removes the surface from the UI

## Transport Layers

A2UI messages can be sent over various transports:

### 1. Server-Sent Events (SSE)

Most common for web applications. Server pushes messages to client over HTTP.

```javascript
const eventSource = new EventSource('/api/a2ui-stream');
eventSource.onmessage = (event) => {
  const message = JSON.parse(event.data);
  renderer.handleMessage(message);
};
```

### 2. WebSockets

Bidirectional communication for real-time interactions.

```javascript
const ws = new WebSocket('wss://example.com/a2ui');
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  renderer.handleMessage(message);
};
```

### 3. A2A Protocol

When using the Agent-to-Agent protocol, A2UI messages are wrapped in A2A artifacts.

```json
{
  "type": "artifact",
  "artifactType": "application/a2ui+jsonl",
  "content": "{\"createSurface\":{\"surfaceId\":\"main\"}}\n{\"updateComponents\":{...}}"
}
```

### 4. HTTP Polling (Not Recommended)

For simple cases, client can poll an endpoint. This misses the streaming benefits.

```javascript
setInterval(async () => {
  const response = await fetch('/api/a2ui-messages');
  const messages = await response.json();
  messages.forEach(msg => renderer.handleMessage(msg));
}, 1000);
```

## Progressive Rendering

A key feature of A2UI is **progressive rendering**—the UI updates as messages arrive, not all at once.

### Traditional Approach

```
Time 0s:  [User sends message]
Time 3s:  [Agent returns complete UI JSON]
Time 3s:  [Client renders everything at once]
```

**User experience:** Stares at loading spinner for 3 seconds, then sees complete UI instantly.

### A2UI Approach

```
Time 0.0s: [User sends message]
Time 0.2s: [createSurface] → Client shows surface container
Time 0.5s: [updateComponents - header] → Client shows header
Time 1.0s: [updateComponents - form] → Client shows form skeleton
Time 1.5s: [updateComponents - fields] → Client shows all fields
Time 2.0s: [updateDataModel] → Client populates form with data
```

**User experience:** Sees UI building up in real-time, feels more responsive.

## Error Handling

### Malformed Messages

If a message fails to parse or validate:

**Option 1:** Skip and continue (for non-critical errors)

```javascript
try {
  renderer.handleMessage(message);
} catch (error) {
  console.warn('Invalid A2UI message:', error);
  // Continue processing next message
}
```

**Option 2:** Send error back to agent

```json
{
  "error": {
    "message": "Invalid component ID reference",
    "surfaceId": "booking",
    "componentId": "unknown-component"
  }
}
```

The agent can then send corrective messages.

### Network Interruptions

If the stream is interrupted:

1. **Client:** Display error state in the affected surface
2. **Client:** Attempt to reconnect
3. **Agent:** When reconnected, re-send full surface state or resume from last known state

## Performance Considerations

### Batching

While A2UI supports one message per line, agents can send multiple updates in rapid succession. Clients should:

- **Buffer updates** for 16ms (one animation frame)
- **Batch render** all pending updates together
- Avoid rendering on every single message

### Diffing

When `updateComponents` is sent with existing component IDs:

- **Compare** old and new component definitions
- **Update only changed properties**
- Keep component instances intact to preserve state

### Data Model Updates

Use granular JSON Pointer paths for efficiency:

```json
// ❌ Bad: Replace entire model
{"updateDataModel": {"surfaceId": "main", "op": "replace", "path": "/", "value": {...}}}

// ✅ Good: Update only what changed
{"updateDataModel": {"surfaceId": "main", "op": "replace", "path": "/user/name", "value": "Alice"}}
```

## Next Steps

- **[Components & Structure](components.md)**: Learn about the adjacency list model
- **[Data Binding](data-binding.md)**: Understand how components bind to data
- **[Agent Development Guide](../guides/agent-development.md)**: Build agents that generate A2UI
