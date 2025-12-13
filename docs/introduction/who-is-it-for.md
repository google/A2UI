# Who is A2UI For?

Developers building AI-powered applications with rich, dynamic user interfaces.

## Three Audiences

### 1. Host App Developers (Frontend)

Building the application users interact with: multi-agent platforms, enterprise AI assistants, customer-facing chatbots, cross-platform apps.

**Why A2UI:**
- Maintain brand control with your design system
- Support multiple agents (local, remote, third-party)
- Security: no arbitrary code execution
- Cross-platform: web, mobile, desktop
- Works with AG UI, A2A, or custom transport

**Get started:** [Client Setup](../guides/client-setup.md) | [Theming](../guides/theming.md) | [Custom Components](../guides/custom-components.md)

### 2. Agent Developers (Backend/AI)

Building AI agents for task automation, information retrieval, interactive assistance, workflow orchestration, domain-specific applications.

**Why A2UI:**
- Generate forms, dashboards, visualizations beyond text
- LLM-friendly format for incremental generation
- Portable across all A2UI clients
- Progressive disclosure with streaming
- Support complex workflows

**Get started:** [Agent Development](../guides/agent-development.md) | [Protocol Reference](../reference/protocol.md) | [Components](../reference/components.md)

### 3. Platform Builders (SDK Creators)

Building agent orchestration platforms, multi-agent systems, developer tools, enterprise frameworks, UI framework integrations.

**Why A2UI:**
- Standard protocol, don't reinvent
- Interoperable with A2A and other protocols
- Extensible with custom catalogs
- Open source (Apache 2.0), growing community

**Get started:** [Protocol Specification](../reference/protocol.md) | [Community](../community.md) | [Roadmap](../roadmap.md)

---

## Use Cases

| Use Case | Your Role | Key Benefits |
|----------|-----------|--------------|
| **Enterprise internal tools** | Host App Dev | Consistent branding, multi-agent support, security, mobile-friendly |
| **SaaS with AI features** | Agent + Host Dev | Rich dashboards/forms, matches existing design, easy to extend |
| **Multi-agent marketplace** | Platform Builder | Standardized protocol, security boundaries, consistent UX |
| **Mobile-first agent app** | Host App Dev | Flutter renderer, web + mobile, offline-capable, touch-optimized |
| **Agent development SDK** | Platform Builder | Built-in UI generation, LLM integration, validation tools |

## When NOT to Use A2UI

❌ **Static websites** → Use HTML/CSS
❌ **Simple text chatbots** → Use plain text or Markdown
❌ **Traditional apps without agents** → Use framework's normal components
❌ **Agents need full styling control** → A2UI gives styling control to client

## Quick Decision Guide

| Requirement | A2UI? |
|------------|-------|
| Agent-generated UI | ✅ Core purpose |
| Multi-agent system | ✅ Perfect fit |
| Cross-platform | ✅ One agent, many renderers |
| Security critical | ✅ Declarative, no code execution |
| Brand consistency | ✅ Client controls styling |
| Rich interactivity | ✅ Forms, buttons, tables |
| Static website | ❌ Use HTML |
| Simple text chat | ❌ Use Markdown |
| Agent controls styling | ⚠️ Semantic styles only |

## Next Steps

**Host App Developers:** [What is A2UI?](what-is-a2ui.md) → [Quickstart](../quickstart.md) → [Client Setup](../guides/client-setup.md)

**Agent Developers:** [What is A2UI?](what-is-a2ui.md) → [Quickstart](../quickstart.md) → [Agent Development](../guides/agent-development.md)

**Platform Builders:** [Protocol Spec](../reference/protocol.md) → [Roadmap](../roadmap.md) → [Community](../community.md)
