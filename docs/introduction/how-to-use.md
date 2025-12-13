# How Can I Use A2UI?

A2UI is flexible and can be integrated into your stack in multiple ways. This guide helps you choose the right approach for your use case.

## Three Integration Paths

### Path 1: I'm Building a Host Application

**You're creating the frontend application where users will see agent-generated UIs.**

```
┌─────────────────────────────────────┐
│   Your Application (Frontend)      │
│  ┌───────────────────────────────┐ │
│  │     A2UI Renderer             │ │
│  │  (Angular/Lit/Flutter/React)  │ │
│  └───────────────────────────────┘ │
└─────────────────┬───────────────────┘
                  │ A2UI Messages
                  │
         ┌────────┴────────┐
         │   Agent(s)      │
         │  (Backend)      │
         └─────────────────┘
```

**Steps:**

1. **Choose a renderer** based on your stack:
   - **Web (Framework-agnostic):** [Lit Web Components](../guides/client-setup.md#web-components-lit)
   - **Angular:** [Angular Renderer](../guides/client-setup.md#angular)
   - **Flutter:** [GenUI SDK](../guides/client-setup.md#flutter-genui-sdk)
   - **React:** Coming Q1 2026

2. **Install the renderer:**
   ```bash
   npm install @a2ui/renderer-lit
   # or
   npm install @a2ui/renderer-angular
   # or (Flutter)
   flutter pub add flutter_genui
   ```

3. **Set up the renderer in your app:**
   ```typescript
   import { A2UIRenderer } from '@a2ui/renderer-lit';

   const renderer = new A2UIRenderer({
     container: document.getElementById('app'),
     onAction: (action) => {
       // Send action to your backend
     }
   });
   ```

4. **Connect to message stream:**
   ```typescript
   // SSE Example
   const eventSource = new EventSource('/api/a2ui-stream');
   eventSource.onmessage = (event) => {
     const message = JSON.parse(event.data);
     renderer.processMessage(message);
   };
   ```

5. **Customize styling** to match your brand:
   - [Theming Guide](../guides/theming.md)

**Best for:**
- Building custom agent experiences
- Integrating agents into existing applications
- Multi-agent platforms
- Enterprise applications with branding requirements

---

### Path 2: I'm Building an Agent

**You're creating the backend agent that generates UI responses.**

```
┌─────────────────────────────────────┐
│   Your Agent (Backend)              │
│  ┌───────────────────────────────┐ │
│  │   LLM (Gemini/GPT/Claude)     │ │
│  └──────────┬────────────────────┘ │
│             │ Generates             │
│  ┌──────────▼────────────────────┐ │
│  │   A2UI Message Generator      │ │
│  └──────────┬────────────────────┘ │
└─────────────┼───────────────────────┘
              │ Streams messages
              ▼
     ┌────────────────┐
     │  Client App    │
     │  (Any A2UI     │
     │   renderer)    │
     └────────────────┘
```

**Steps:**

1. **Choose your LLM and framework:**
   - **Python:** Google ADK, LangChain, or custom
   - **Node.js:** A2A SDK, Vercel AI SDK, or custom

2. **Set up A2UI generation:**
   ```python
   import google.generativeai as genai

   # Include A2UI schema in prompt
   SYSTEM_PROMPT = """
   You generate A2UI interfaces. Here's the format:
   - createSurface: Initialize a UI surface
   - updateComponents: Add UI components
   - updateDataModel: Populate with data

   Generate one JSON message per line (JSONL).
   """

   def generate_ui(user_message: str):
       response = model.generate_content(
           f"{SYSTEM_PROMPT}\n\nUser: {user_message}\n\nA2UI:"
       )

       # Parse and validate
       messages = parse_jsonl(response.text)
       return messages
   ```

3. **Stream messages to client:**
   ```python
   from flask import Response

   @app.route('/api/a2ui-stream')
   def stream_ui():
       def generate():
           messages = generate_ui(user_input)
           for msg in messages:
               yield f"data: {json.dumps(msg)}\n\n"

       return Response(generate(), mimetype='text/event-stream')
   ```

4. **Handle user actions:**
   ```python
   @app.route('/api/actions', methods=['POST'])
   def handle_action():
       action = request.json

       # Process action
       response_messages = process_action(action)

       # Send updated UI
       return jsonify(response_messages)
   ```

**Best for:**
- Building task-specific agents (booking, search, forms)
- Creating agents that work with any A2UI client
- Agents that need rich, interactive UIs
- Multi-agent systems where agents contribute UI

---

### Path 3: I'm Using an Existing Framework

**You're building with a framework that already supports A2UI.**

Several frameworks have built-in A2UI support:

#### AG UI / CopilotKit

[AG UI](https://ag-ui.com/) provides a full-stack framework for building agentic applications with A2UI support.

```typescript
import { CopilotKit } from '@copilotkit/react-core';
import { A2UIRenderer } from '@a2ui/renderer-react';

function App() {
  return (
    <CopilotKit agentUrl="/api/agent">
      <A2UIRenderer />
      {/* Your app */}
    </CopilotKit>
  );
}
```

**Best for:** Building full-stack agentic applications with React

#### Flutter GenUI SDK

[GenUI SDK](https://docs.flutter.dev/ai/genui) for Flutter uses A2UI under the covers.

```dart
import 'package:flutter_genui/flutter_genui.dart';

MaterialApp(
  home: GenUIScreen(
    agentUrl: 'https://your-agent.com',
  ),
)
```

**Best for:** Cross-platform mobile/desktop apps with generative UI

#### A2A Protocol

Use A2UI with the [A2A Protocol](https://a2a-protocol.org) for agent-to-agent communication.

```typescript
import { A2AClient } from '@a2a/client';

const client = new A2AClient({
  agentUrl: 'https://remote-agent.com'
});

client.on('artifact', (artifact) => {
  if (artifact.type === 'application/a2ui+jsonl') {
    // Parse and render A2UI messages
    const messages = parseJsonl(artifact.content);
    messages.forEach(msg => renderer.processMessage(msg));
  }
});
```

**Best for:** Multi-agent systems, agent marketplaces, enterprise agent meshes

---

## Transport Options

A2UI messages can be sent over various transports:

### Server-Sent Events (SSE)

**Best for:** Web applications, simple setup

```javascript
const eventSource = new EventSource('/api/a2ui-stream');
eventSource.onmessage = (event) => {
  renderer.processMessage(JSON.parse(event.data));
};
```

**Pros:**
- ✅ Simple HTTP-based
- ✅ Built-in browser support
- ✅ Automatic reconnection

**Cons:**
- ❌ Unidirectional (server → client)
- ❌ Limited to web browsers

### WebSockets

**Best for:** Real-time bidirectional communication

```javascript
const ws = new WebSocket('wss://api.example.com/a2ui');

ws.onmessage = (event) => {
  renderer.processMessage(JSON.parse(event.data));
};

// Send actions back
ws.send(JSON.stringify({
  userAction: { actionId: 'submit', surfaceId: 'main' }
}));
```

**Pros:**
- ✅ Bidirectional
- ✅ Low latency
- ✅ Efficient for high-frequency updates

**Cons:**
- ❌ More complex setup
- ❌ Requires WebSocket server

### A2A Protocol

**Best for:** Multi-agent systems, enterprise meshes

```typescript
// A2UI messages embedded in A2A artifacts
{
  "type": "artifact",
  "artifactType": "application/a2ui+jsonl",
  "content": "{\\"createSurface\\":...}\\n{\\"updateComponents\\":...}"
}
```

**Pros:**
- ✅ Multi-agent support
- ✅ Standardized agent communication
- ✅ Security and authentication built-in

**Cons:**
- ❌ Requires A2A infrastructure

### HTTP Polling

**Best for:** Simple cases, testing

```javascript
setInterval(async () => {
  const response = await fetch('/api/a2ui-messages');
  const messages = await response.json();
  messages.forEach(msg => renderer.processMessage(msg));
}, 1000);
```

**Pros:**
- ✅ Very simple

**Cons:**
- ❌ Inefficient
- ❌ High latency
- ❌ Misses streaming benefits

---

## Quick Start Options

### Option 1: Run the Demo (Fastest)

Get hands-on experience in 5 minutes:

```bash
git clone https://github.com/google/a2ui.git
cd a2ui/samples/client/angular
export GEMINI_API_KEY="your_key"
npm install
npm run demo:restaurant
```

[Full Quickstart Guide](../quickstart.md)

### Option 2: Integrate a Renderer

Add A2UI to your existing app:

**Web:**
```bash
npm install @a2ui/renderer-lit
```

**Angular:**
```bash
npm install @a2ui/renderer-angular
```

**Flutter:**
```bash
flutter pub add flutter_genui
```

[Client Setup Guide](../guides/client-setup.md)

### Option 3: Build an Agent

Create an agent that generates A2UI:

1. Choose your LLM (Gemini, GPT, Claude)
2. Include A2UI schema in prompts
3. Generate JSONL messages
4. Stream to client

[Agent Development Guide](../guides/agent-development.md)

---

## Common Patterns

### Pattern 1: Single Agent, Single Client

Simplest setup—one agent, one frontend.

```
User ←→ Client App ←→ Your Agent
```

**Use case:** Internal tool, simple chatbot with UI

### Pattern 2: Multiple Agents, Single Client

Client coordinates multiple agents.

```
           ┌─ Agent A (Search)
User ←→ Client ┼─ Agent B (Booking)
           └─ Agent C (Analytics)
```

**Use case:** Multi-agent assistant, orchestrator pattern

### Pattern 3: Single Agent, Multiple Clients

Agent works with different client types.

```
Web Client     ─┐
Mobile Client  ─┼─ Your Agent
Desktop Client ─┘
```

**Use case:** Cross-platform agent service

### Pattern 4: Agent Mesh

Multiple agents, multiple clients, orchestrated.

```
Client A ─┐      ┌─ Agent 1
Client B ─┼─ Hub ┼─ Agent 2
Client C ─┘      └─ Agent 3
```

**Use case:** Enterprise agent marketplace, agent-to-agent communication

---

## Next Steps

**Choose your path:**

- **I'm building a frontend:** → [Client Setup Guide](../guides/client-setup.md)
- **I'm building an agent:** → [Agent Development Guide](../guides/agent-development.md)
- **I want to see it working:** → [Quickstart](../quickstart.md)
- **I need to understand it better:** → [Core Concepts](../concepts/overview.md)

**Still have questions?**

- Check [Who is A2UI for?](who-is-it-for.md) to confirm it fits your use case
- See [Where is it used?](where-is-it-used.md) for real-world examples
- Join the [Community](../community.md) and ask questions
