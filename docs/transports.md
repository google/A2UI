# Transports (Message Passing)

Transports deliver A2UI messages from agents to clients. A2UI is transport-agnostic—use any method that can send JSON.

The actual component rendering is done by the [renderer](renderers.md),
and the [agents](agents.md) are responsible for generating the A2UI messages.
Getting the messages from the agent to the client is the job of the transport.

## How It Works

```
Agent → Transport → Client Renderer
```

A2UI defines a sequence of JSON messages. The transport layer is responsible for delivering this sequence from the agent to the client. A common transport mechanism is a stream using a format like JSON Lines (JSONL), where each line is a single A2UI message.

## Available Transports

| Transport | Status | Use Case |
|-----------|--------|----------|
| **A2A Protocol** | ✅ Stable | Multi-agent systems, enterprise meshes |
| **AG UI** | ✅ Stable | Full-stack React applications |
| **REST API** | 📋 Planned | Simple HTTP endpoints |
| **WebSockets** | 💡 Proposed | Real-time bidirectional |
| **SSE (Server-Sent Events)** | 💡 Proposed | Web streaming |

## A2A Protocol

The [Agent2Agent (A2A) protocol](https://a2a-protocol.org) provides secure,
standardized agent communication.  An A2A extension provides easy integration with A2UI.

**Benefits:**

- Security and authentication built-in
- Bindings for many message formats, auth, and transport protocols
- Clean separation of concerns

If you are using A2A, this should be nearly automatic.

TODO: Add a detailed guide.

**See:** [A2A Extension Specification](specification/v0.8-a2a-extension.md)

## AG UI

[AG UI](https://ag-ui.com/) translates from A2UI messages to AG UI messages, and handles transport and state sync automatically.

If you are using AG UI, this should be automatic.

TODO: Add a detailed guide.

## Custom Transports

You can use any transport that sends JSON:

**HTTP/REST:**

```javascript
const response = await fetch('/api/agent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(clientEventMessage)
});

if (response.ok) {
  const serverMessages = await response.json();
  // Pass messages to your A2UI renderer
  processor.processMessages(serverMessages);
}
```

**WebSockets:**

```javascript
const socket = new WebSocket('ws://localhost:8080');

socket.addEventListener('open', () => {
  socket.send(JSON.stringify(clientEventMessage));
});

socket.addEventListener('message', (event) => {
  const serverMessage = JSON.parse(event.data);
  // Pass individual message to your A2UI renderer
  processor.processMessages([serverMessage]);
});
```

**Server-Sent Events:**

```javascript
const eventSource = new EventSource('/api/agent/stream');

eventSource.onmessage = (event) => {
  const serverMessage = JSON.parse(event.data);
  // Pass individual message to your A2UI renderer
  processor.processMessages([serverMessage]);
};
```

```

## Next Steps

- **[A2A Protocol Docs](https://a2a-protocol.org)**: Learn about A2A
- **[A2A Extension Spec](specification/v0.8-a2a-extension.md)**: A2UI + A2A details