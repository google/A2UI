# Transports (Message Passing)

Transports deliver A2UI messages from agents to clients. A2UI is transport-agnostic—use any method that can send JSON.

## How It Works

```
Agent → Transport → Client Renderer
```

A2UI messages are JSON objects sent as a stream (JSONL format). The transport layer handles delivery.

## Available Transports

| Transport | Status | Use Case |
|-----------|--------|----------|
| **A2A Protocol** | ✅ Stable | Multi-agent systems, enterprise meshes |
| **AG UI** | ✅ Stable | Full-stack React applications |
| **REST API** | 📋 Planned | Simple HTTP endpoints |
| **WebSockets** | 💡 Proposed | Real-time bidirectional |
| **SSE (Server-Sent Events)** | 💡 Proposed | Web streaming |

## A2A Protocol (Recommended)

The [Agent2Agent (A2A) protocol](https://a2a-protocol.org) provides secure, standardized agent communication with built-in A2UI support.

**Benefits:**
- Security and authentication built-in
- Multi-agent coordination
- Clean separation of structure and data
- Mitigates UI injection risks

**See:** [A2A Extension Specification](specification/v0.8-a2a-extension.md)

## AG UI / CopilotKit

[AG UI](https://ag-ui.com/) and [CopilotKit](https://www.copilotkit.ai/) have day-zero A2UI compatibility, handling state sync and message transport automatically.

## Custom Transports

You can use any transport that sends JSON:

**HTTP/REST:**
```javascript
const response = await fetch('/api/a2ui', {
  method: 'POST',
  body: JSON.stringify(userMessage)
});
const messages = await response.json();
```

**WebSockets:**
```javascript
const ws = new WebSocket('wss://api.example.com/a2ui');
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  renderer.processMessage(message);
};
```

**Server-Sent Events:**
```javascript
const eventSource = new EventSource('/api/a2ui-stream');
eventSource.onmessage = (event) => {
  renderer.processMessage(JSON.parse(event.data));
};
```

## Next Steps

- **[A2A Protocol Docs](https://a2a-protocol.org)**: Learn about A2A
- **[A2A Extension Spec](specification/v0.8-a2a-extension.md)**: A2UI + A2A details
- **[Agent Development](guides/agent-development.md)**: Build agents that stream A2UI