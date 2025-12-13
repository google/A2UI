# Who is A2UI For?

A2UI is designed for developers building AI-powered applications that need rich, dynamic user interfaces. Whether you're building the frontend, the backend agent, or the platform that connects them, A2UI provides the protocol you need.

## The Three Audiences

### 1. Host App Developers (Frontend)

**You're building the application that users interact with.**

You might be working on:

- A multi-agent collaboration platform
- An enterprise AI assistant interface
- A customer-facing chatbot with rich UI
- A cross-platform app (web + mobile) with agent features
- A branded agent experience that needs perfect visual consistency

**Why A2UI?**

- ✅ **Maintain brand control**: Your app renders all UI with your design system
- ✅ **Support multiple agents**: Render UI from local agents, remote agents, or third-party agents
- ✅ **Security**: No arbitrary code execution—only pre-approved components
- ✅ **Cross-platform**: One protocol works on web, mobile, and desktop
- ✅ **Integration flexibility**: Works with AG UI, A2A, or your custom transport

**What you'll do:**

- Integrate an A2UI renderer (Angular, Lit, Flutter, or build your own)
- Define your component catalog and styling
- Handle incoming A2UI messages from agents
- Send user actions back to agents

**Start here:**

- [Client Setup Guide](../guides/client-setup.md) - Integration instructions
- [Theming Guide](../guides/theming.md) - Customize the look and feel
- [Custom Components](../guides/custom-components.md) - Extend with your own widgets

---

### 2. Agent Developers (Backend/AI)

**You're building AI agents that need to provide rich, interactive experiences.**

You might be working on:

- Task automation agents (booking, scheduling, data entry)
- Information retrieval agents (search, analytics, reporting)
- Interactive assistants (customer service, IT support, sales)
- Workflow orchestrators that coordinate multiple agents
- Domain-specific agents (medical, legal, financial, etc.)

**Why A2UI?**

- ✅ **Beyond text responses**: Generate forms, dashboards, data visualizations
- ✅ **LLM-friendly format**: Easy for LLMs to generate incrementally
- ✅ **Portable**: Your agent works with any A2UI client (web, mobile, desktop)
- ✅ **Progressive disclosure**: Stream UI as you generate it
- ✅ **Interactivity**: Support complex workflows with buttons, forms, and actions

**What you'll do:**

- Generate A2UI JSON messages using LLMs (Gemini, GPT, Claude, etc.)
- Stream messages to clients over A2A, AG UI, or custom transport
- Handle user actions and respond with UI updates
- Validate generated messages against the schema

**Start here:**

- [Agent Development Guide](../guides/agent-development.md) - Build agents that generate A2UI
- [Protocol Reference](../reference/protocol.md) - Understand the message format
- [Component Gallery](../reference/components.md) - See what components you can use

---

### 3. Platform Builders (SDK Creators)

**You're building frameworks, SDKs, or platforms that enable agent-to-UI capabilities.**

You might be working on:

- Agent orchestration platforms
- Multi-agent coordination systems
- Developer tools for agentic applications
- Enterprise agent frameworks
- New UI framework integrations

**Why A2UI?**

- ✅ **Standard protocol**: Don't reinvent the wheel—use an established protocol
- ✅ **Interoperability**: Works with A2A and other protocols
- ✅ **Extensible**: Custom catalogs for domain-specific components
- ✅ **Community**: Join an ecosystem of developers and companies
- ✅ **Open source**: Apache 2.0 license, fully transparent

**What you'll do:**

- Build A2UI renderers for new platforms/frameworks
- Create tools for generating, validating, or debugging A2UI
- Integrate A2UI into your SDK or platform
- Contribute to the protocol specification

**Start here:**

- [Protocol Specification](../reference/protocol.md) - Full technical details
- [Community](../community.md) - Get involved and contribute
- [Roadmap](../roadmap.md) - See what's being built

---

## Use Case Examples

### Enterprise Applications

**Scenario:** You're building an internal tool where employees interact with multiple AI agents for different tasks (HR queries, IT support, data analysis).

**Your role:** Host App Developer

**Why A2UI:**
- Maintain consistent branding across all agent responses
- Support agents from different teams/vendors
- Ensure security with component catalog whitelisting
- Mobile-friendly UI for field workers

---

### SaaS Product with AI Features

**Scenario:** You're adding AI-powered features to your SaaS product (automated reporting, smart forms, data insights).

**Your role:** Agent Developer + Host App Developer

**Why A2UI:**
- Your agents can generate rich dashboards and forms
- UI matches your existing product design
- Works alongside your current UI framework
- Easy to add new agent features without frontend changes

---

### Multi-Agent Marketplace

**Scenario:** You're building a platform where users can discover and use agents from different providers.

**Your role:** Platform Builder

**Why A2UI:**
- Standardized UI protocol across all agents
- Security boundaries between agents
- Consistent UX regardless of agent provider
- Easy certification/validation of agent outputs

---

### Mobile-First Agent App

**Scenario:** You're building a mobile app with AI agents for on-the-go tasks (travel planning, expense tracking, shopping).

**Your role:** Host App Developer

**Why A2UI:**
- Flutter renderer for native mobile performance
- Same backend agents work on web and mobile
- Offline-capable with cached UI states
- Touch-optimized components

---

### Agent Development Framework

**Scenario:** You're building an SDK that helps developers create AI agents more easily.

**Your role:** Platform Builder

**Why A2UI:**
- Built-in UI generation capabilities
- Easy integration with popular LLMs
- Validation and testing tools
- Works with multiple client frameworks

---

## When NOT to Use A2UI

A2UI is powerful, but it's not the right choice for every scenario:

### ❌ Static Websites

If you're building a traditional website with hand-coded HTML/CSS, just use HTML/CSS. A2UI is for **agent-generated** UIs, not static content.

### ❌ Simple Chatbots

If your agent only needs to send text and receive text, you don't need A2UI. Markdown or plain text is simpler.

**Use A2UI when:**
- You need forms, buttons, or interactive components
- You want to display structured data (tables, cards, timelines)
- Users need to perform actions beyond just chatting

### ❌ Single Platform, No Agents

If you're building a traditional web or mobile app without AI agents, use your framework's normal components.

**Use A2UI when:**
- Agents need to generate UI dynamically
- You need to render UI from external/untrusted agents
- You want portability across platforms

### ❌ Full Design Control from Agents

If you want agents to have complete control over styling (colors, fonts, layout), A2UI might be too restrictive. A2UI gives styling control to the client.

**Use A2UI when:**
- Client controls branding and styling
- Security is important (no arbitrary CSS/code)
- Consistency matters across agent responses

---

## Decision Matrix

Use this table to determine if A2UI is right for you:

| Requirement | A2UI Fits? | Notes |
|------------|-----------|-------|
| Agent-generated UI | ✅ Yes | A2UI's core purpose |
| Multi-agent system | ✅ Yes | Perfect for agent orchestration |
| Cross-platform (web + mobile) | ✅ Yes | One agent, multiple renderers |
| Security critical | ✅ Yes | Declarative, no code execution |
| Brand consistency important | ✅ Yes | Client controls all styling |
| Need rich interactivity | ✅ Yes | Forms, buttons, tables, etc. |
| Static website | ❌ No | Just use HTML |
| Simple text chat | ❌ No | Plain text or Markdown |
| Agent controls styling | ⚠️ Partial | Agents specify semantic styles only |
| Real-time collaboration | ⚠️ Partial | A2UI handles UI; you need transport |

## Next Steps

**For Host App Developers:**
1. Read [What is A2UI?](what-is-a2ui.md) to understand the protocol
2. Try the [Quickstart](../quickstart.md) to see it in action
3. Follow the [Client Setup Guide](../guides/client-setup.md) to integrate

**For Agent Developers:**
1. Understand [How A2UI works](what-is-a2ui.md)
2. Run the [Quickstart demo](../quickstart.md) agent
3. Build your own with the [Agent Development Guide](../guides/agent-development.md)

**For Platform Builders:**
1. Review the [Protocol Specification](../reference/protocol.md)
2. Check the [Roadmap](../roadmap.md) to avoid duplicate work
3. Join the [Community](../community.md) and contribute

**Not sure yet?**
- See [Where is it used?](where-is-it-used.md) for real-world examples
- Explore the [Ecosystem comparison](../ecosystem.md) to understand how A2UI fits with other tools
