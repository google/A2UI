# A2UI in the Agent Ecosystem

The space for agentic UI is evolving rapidly, with excellent tools emerging to solve different parts of the stack. A2UI is not a replacement for these frameworks—it's a specialized protocol that solves the specific problem of **interoperable, cross-platform, generative or template-based UI responses.**

## At a glance

The A2UI approach is to send JSON as a message to the client, which then uses a renderer to convert it into native UI components.  LLMs can generate the component layout on the fly or you can use a template.

> 💡
>
> **This makes it secure like data, and expressive like code.**

This rest of this page will help you understand A2UI in relationship to other options.

## Navigating the Agentic UI Ecosystem

### 1. Building the "Host" Application UI

If you're building a full-stack application (the "host" UI that the user interacts with), in addition to building the actual UI, you may also utilize a framework **(AG UI / CopilotKit, Vercel AI SDK, GenUI SDK for Flutter which already uses A2UI under the covers)** to handle the "pipes": state synchronization, chat history, and input handling.

**Where A2UI fits:** A2UI is complementary. If you connect your host application using AG UI, it can use A2UI as the data format for rendering responses from the host agent and also from third-party or remote agents. This gives you the best of both worlds: a rich, stateful host app that can safely render content from external agents it doesn't control.

- **A2UI with A2A:** You can send via A2A directly to a client front end.
- **A2UI with AG UI:** You can send via AG UI directly to a client front end.
- A2UI with REST, SSE, WebSockets and other transports are feasible but not yet available.

### 2. UI as a "Resource" (MCP Apps)

The **Model Context Protocol (MCP)** has [recently introduced **MCP Apps**](https://blog.modelcontextprotocol.io/posts/2025-11-21-mcp-apps/), a new standard consolidating the great work from MCP-UI and OpenAI to enable servers to provide interactive interfaces. This approach treats UI as a resource (accessed via a `ui://` URI) that tools can return, typically rendering pre-built HTML content within a sandboxed `iframe` to ensure isolation and security.

**How A2UI is different:** A2UI takes a "native-first" approach that is distinct from the resource-fetching model of MCP Apps. Instead of retrieving an opaque payload to display in a sandbox, an A2UI agent sends a blueprint of native components. This allows the UI to inherit the host app's styling and accessibility features perfectly. In a multi-agent system, an orchestrator agent can easily understand the lightweight A2UI message content from a subagent, allowing for more fluid collaboration between agents.

### 3. Platform-Specific Ecosystems (OpenAI ChatKit)

Tools like **ChatKit** offer a highly integrated, optimized experience for deploying agents specifically within the OpenAI ecosystem.

**How A2UI is different:** A2UI is designed for developers building their own agentic surfaces across Web, Flutter, and native mobile, or for enterprise meshes (like **A2A**) where agents need to communicate across trust boundaries. A2UI gives the client more control over styling at the expense of the agent, in order to allow for greater visual consistency with the host client application.
