# Use A2UI with Any Agent Framework (Using AG-UI)

A2UI is a declarative UI format. [AG-UI](https://ag-ui.com/) is the transport
that carries A2UI messages between an agent and the browser. CopilotKit's
AG-UI implementation is the fastest path to putting A2UI in front of users
today — any agent framework CopilotKit supports (ADK, LangGraph, CrewAI,
Mastra, custom Python/TS services, etc.) can emit A2UI and render it in a
React app with no transport glue.

!!! info "Source of truth"

    This guide mirrors the key steps from CopilotKit's
    [ADK + A2UI docs](https://docs.copilotkit.ai/adk/generative-ui/a2ui).
    Refer to the CopilotKit docs for the latest API surface.

## 1. Set up CopilotKit

Install CopilotKit into a React/Next.js app with the framework of your
choice (ADK, LangGraph, CrewAI, Mastra, etc.):

```bash
npx copilotkit@latest init
```

Or follow the [CopilotKit quickstart](https://docs.copilotkit.ai/quickstart)
to wire it into an existing project. This is the standard CopilotKit setup —
no A2UI-specific scaffold.

## 2. Enable A2UI

### Backend

Turn on A2UI in `CopilotRuntime` and inject the `render_a2ui` tool so your
agent can produce A2UI surfaces:

```ts title="app/api/copilotkit/route.ts"
import { CopilotRuntime } from "@copilotkit/runtime";

const runtime = new CopilotRuntime({
  agents: { default: myAgent },
  a2ui: { injectA2UITool: true },
});
```

Scope to specific agents with `a2ui: { injectA2UITool: true, agents: ["my-agent"] }`.

### Frontend

The A2UI renderer activates automatically. Optionally pass a theme:

{% raw %}
```tsx
import { CopilotKitProvider } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import { myCustomTheme } from "@copilotkit/a2ui-renderer";

<CopilotKitProvider runtimeUrl="/api/copilotkit" a2ui={{ theme: myCustomTheme }}>
  {children}
</CopilotKitProvider>
```
{% endraw %}

### Custom components (BYOC)

To extend the built-in A2UI catalog with your own React components, see
CopilotKit's [Custom Components (BYOC) section](https://docs.copilotkit.ai/adk/generative-ui/a2ui#custom-components-byoc)
— define Zod schemas, map them to React renderers, and pass the catalog
through the provider's `a2ui` prop.

## 3. Advanced usage

For the full A2UI integration surface (custom catalogs, fine-grained control,
advanced patterns), see CopilotKit's
[A2UI docs](https://docs.copilotkit.ai/generative-ui/a2ui).

## What's next

- **[A2UI Composer](https://a2ui-composer.ag-ui.com/)** — build widgets visually.
- **[Concepts › Transports](../concepts/transports.md)** — how A2UI maps onto AG-UI.
- **[v0.9 specification](../specification/v0.9-a2ui.md)** — the underlying protocol.
