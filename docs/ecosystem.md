# A2UI in the Agent Ecosystem

The space for agentic UI is evolving rapidly, with excellent tools emerging to solve different parts of the stack. **A2UI is not a replacement for these frameworks**—it's a specialized protocol that solves the specific problem of **interoperable, cross-platform, generative or template-based UI responses.**

This guide helps you understand when to use A2UI, when to use other tools, and how they work together.

## Protocol vs. Framework

A2UI is a **protocol**, not a framework. Think of it this way:

- **A2UI handles the "payload"**: The format for describing UI that agents send to clients
- **Other tools handle the "pipes"**: Transport, state synchronization, chat history, input handling

This means A2UI is often used *in combination* with other tools, not instead of them.

## Navigating the Landscape

### 1. Building the Host Application UI

**Tools:** AG UI, Vercel AI SDK, GenUI SDK for Flutter

If you're building a full-stack application (the "host" UI that the user interacts with), you'll want a framework that handles:

- State synchronization between frontend and backend
- Chat history and conversation management
- Input handling and validation
- Session management

**Where A2UI fits:** A2UI is complementary. You can use AG UI or Vercel AI SDK to build your host application, then use A2UI as the data format for rendering responses from:

- Your host agent
- Third-party or remote agents
- Multi-agent orchestrators

This gives you the best of both worlds: a rich, stateful host app that can safely render content from external agents it doesn't control.

#### Example: A2UI + AG UI

```
┌─────────────────────────────────────────┐
│         Your Application                │
│  ┌───────────────────────────────────┐  │
│  │      AG UI Framework              │  │
│  │  (State, Chat, Input Handling)    │  │
│  │                                   │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │    A2UI Renderer            │  │  │
│  │  │  (Renders UI from agents)   │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
         ↕                    ↕
    Your Agent         Remote A2A Agents
```

**When to use both:**
- You want the developer experience of AG UI/Vercel AI SDK
- You need to render UI from multiple agents (local + remote)
- You want to maintain brand consistency across all agent responses

### 2. Transports: Getting UI from Agent to Client

A2UI is transport-agnostic. You can send A2UI messages over:

- **A2A (Agent-to-Agent Protocol)**: For agent-to-agent and agent-to-client communication
- **AG UI**: As the UI response format within AG UI applications
- **REST APIs**: Direct HTTP endpoints (feasible but not yet standardized)
- **WebSockets**: Real-time streaming (feasible but not yet standardized)

**A2UI + A2A** is particularly powerful for multi-agent systems where remote agents need to provide UI responses through an orchestrator.

### 3. UI as a Resource: MCP Apps

**Tool:** Model Context Protocol (MCP) Apps

MCP recently introduced [MCP Apps](https://blog.modelcontextprotocol.io/posts/2025-11-21-mcp-apps/), a standard that enables MCP servers to provide interactive interfaces. MCP Apps treat UI as a resource (accessed via a `ui://` URI) that tools can return, typically rendering pre-built HTML content within a sandboxed `iframe` to ensure isolation and security.

**How A2UI is different:**

| Aspect | MCP Apps | A2UI |
|--------|----------|------|
| **Rendering Model** | Resource-fetching (iframe sandbox) | Native components (blueprint) |
| **Styling** | Isolated from host app | Inherits host app styling |
| **Format** | HTML/JavaScript | JSON component descriptions |
| **Security Model** | Sandbox isolation | Component catalog whitelist |
| **Agent Visibility** | Opaque payload | Structured, parseable by orchestrators |
| **Use Case** | Simple tool UIs | Complex, multi-agent, cross-platform UIs |

**When to use MCP Apps:**
- Building tools that need simple, self-contained UIs
- UI is relatively static and doesn't need deep integration
- You're already invested in the MCP ecosystem

**When to use A2UI:**
- Building multi-agent systems where orchestrators coordinate UI from multiple sources
- Need perfect visual consistency with host application
- Supporting multiple platforms (web + mobile)
- Orchestrators need to understand and modify UI from subagents

### 4. Platform-Specific Ecosystems

**Tools:** OpenAI ChatKit, Claude UI Components

Tools like ChatKit offer highly integrated, optimized experiences for deploying agents within specific ecosystems (e.g., OpenAI's platform).

**How A2UI is different:**

| Aspect | ChatKit / Platform UIs | A2UI |
|--------|----------------------|------|
| **Platform** | Single ecosystem | Cross-platform, framework-agnostic |
| **Control** | Platform-controlled styling | Developer-controlled styling |
| **Portability** | Locked to platform | Portable across web, mobile, desktop |
| **Use Case** | Building within a specific platform | Building custom agentic surfaces |

**When to use Platform UIs:**
- Building exclusively for that platform
- Want the tightest integration with platform features
- Prefer convenience over portability

**When to use A2UI:**
- Building your own agentic surfaces across web, Flutter, and native mobile
- Need complete control over branding and styling
- Building enterprise meshes with cross-organizational agents (like A2A)
- Want portability across platforms

### 5. Cross-Platform Generative UI

**Tool:** Flutter GenUI SDK

The [Flutter GenUI SDK](https://docs.flutter.dev/ai/genui) helps you generate dynamic, personalized UIs with Gemini (or other LLMs) that adhere to your brand guidelines. **GenUI SDK uses A2UI as the UI declaration format** between remote server-side agents and Flutter apps.

**This is the "better together" story:** GenUI SDK provides the Flutter developer experience, state management, and widget catalog, while A2UI provides the universal protocol for describing UIs.

## Decision Guide

Use this table to choose the right tool(s) for your use case:

| Scenario | Recommended Tools |
|----------|------------------|
| Building a web app with a single agent | AG UI or Vercel AI SDK |
| Building a Flutter app with generative UI | GenUI SDK (which uses A2UI) |
| Rendering UI from remote/third-party agents | **A2UI** + your framework of choice |
| Multi-agent system with UI coordination | **A2UI** + A2A protocol |
| Cross-platform (web + mobile) agent app | **A2UI** + renderers for each platform |
| Simple tool with isolated UI | MCP Apps |
| Building exclusively for OpenAI | ChatKit |
| Enterprise agent mesh with brand consistency | **A2UI** + AG UI or custom host |

## Better Together: Key Integrations

### AG UI / CopilotKit

[AG UI](https://ag-ui.com/) and [CopilotKit](https://www.copilotkit.ai/) have day-zero compatibility with A2UI.

> "AG UI excels at creating a high-bandwidth connection between a custom-built front-end and its dedicated agent. By adding support for A2UI, we're giving developers the best of both worlds. They can now build rich, state-synced applications that can also render dynamic UIs from third-party agents via A2UI. It's a perfect match for a multi-agent world."
>
> — Atai Barkai, Founder of CopilotKit and AG UI

### Flutter GenUI SDK

The GenUI SDK uses A2UI under the covers when talking to remote or server-side agents.

> "Our developers choose Flutter because it lets them quickly create expressive, brand-rich, custom design systems that feel great on every platform. A2UI was a great fit for Flutter's GenUI SDK because it ensures that every user, on every platform, gets a high quality native feeling experience."
>
> — Vijay Menon, Engineering Director, Dart & Flutter

### Opal: AI Mini-Apps

[Opal](http://opal.google) lets hundreds of thousands of people build, edit, and share AI mini-apps using natural language. The Opal team has been a core contributor to A2UI.

> "A2UI is foundational to our work. It gives us the flexibility to let the AI drive the user experience in novel ways, without being constrained by a fixed front-end. Its declarative nature and focus on security allow us to experiment quickly and safely."
>
> — Dimitri Glazkov, Principal Engineer, Opal Team

### Gemini Enterprise

Gemini Enterprise is integrating A2UI to allow enterprise agents to render rich, interactive UIs.

> "Our customers need their agents to do more than just answer questions; they need them to guide employees through complex workflows. A2UI will allow developers building on Gemini Enterprise to have their agents generate the dynamic, custom UIs needed for any task, from data entry forms to approval dashboards, dramatically accelerating workflow automation."
>
> — Fred Jabbour, Product Manager, Gemini Enterprise

## Summary

A2UI is designed to be a foundational protocol that works *with* your favorite tools:

- **Use A2UI when**: You need portable, secure, cross-platform UI responses from agents—especially in multi-agent or cross-organizational scenarios
- **Combine with**: AG UI, GenUI SDK, or your own framework to handle state, transport, and application logic
- **Choose alternatives when**: You need simple, isolated tool UIs (MCP Apps) or are building exclusively within a single platform ecosystem (ChatKit)

The future of agentic UIs is collaborative, not competitive. A2UI provides the universal protocol for UI descriptions, enabling a rich ecosystem of frameworks and platforms to interoperate.

## Next Steps

- **[Get Started with the Quickstart](quickstart.md)**: Try A2UI with the restaurant finder demo
- **[Learn Core Concepts](concepts/overview.md)**: Understand how A2UI works under the hood
- **[Choose Your Renderer](guides/client-setup.md)**: Set up A2UI for your platform
