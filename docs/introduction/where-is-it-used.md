# Where is A2UI Used?

A2UI is being adopted by teams at Google and partner organizations to build the next generation of agent-driven applications. Here are real-world examples of where A2UI is making an impact.

## Production Deployments

### Google Opal: AI Mini-Apps for Everyone

[Opal](http://opal.google) enables hundreds of thousands of people to build, edit, and share AI mini-apps using natural language—no coding required.

**How Opal uses A2UI:**

The Opal team at Google has been a **core contributor to A2UI** from the beginning. They use A2UI to power the dynamic, generative UI system that makes Opal's AI mini-apps possible.

- **Rapid prototyping**: Build and test new UI patterns quickly
- **User-generated apps**: Anyone can create apps with custom UIs
- **Dynamic interfaces**: UIs adapt to each use case automatically

> "A2UI is foundational to our work. It gives us the flexibility to let the AI drive the user experience in novel ways, without being constrained by a fixed front-end. Its declarative nature and focus on security allow us to experiment quickly and safely."
>
> **— Dimitri Glazkov**, Principal Engineer, Opal Team

**Learn more:** [opal.google](http://opal.google)

---

### Gemini Enterprise: Custom Agents for Business

Gemini Enterprise enables businesses to build powerful, custom AI agents tailored to their specific workflows and data.

**How Gemini Enterprise uses A2UI:**

A2UI is being integrated to allow enterprise agents to render **rich, interactive UIs** within business applications—going beyond simple text responses to guide employees through complex workflows.

- **Data entry forms**: AI-generated forms for structured data collection
- **Approval dashboards**: Dynamic UIs for review and approval processes
- **Workflow automation**: Step-by-step interfaces for complex tasks
- **Custom enterprise UIs**: Tailored interfaces for industry-specific needs

> "Our customers need their agents to do more than just answer questions; they need them to guide employees through complex workflows. A2UI will allow developers building on Gemini Enterprise to have their agents generate the dynamic, custom UIs needed for any task, from data entry forms to approval dashboards, dramatically accelerating workflow automation."
>
> **— Fred Jabbour**, Product Manager, Gemini Enterprise

**Learn more:** [Gemini Enterprise](https://cloud.google.com/gemini)

---

### Flutter GenUI SDK: Generative UI for Mobile

The [Flutter GenUI SDK](https://docs.flutter.dev/ai/genui) brings dynamic, AI-generated UIs to Flutter applications across mobile, desktop, and web.

**How GenUI uses A2UI:**

GenUI SDK uses **A2UI as the underlying protocol** for communication between server-side agents and Flutter applications. When you use GenUI, you're using A2UI under the covers.

- **Cross-platform support**: Same agent works on iOS, Android, web, desktop
- **Native performance**: Flutter widgets rendered natively on each platform
- **Brand consistency**: UIs match your app's design system
- **Server-driven UI**: Agents control what's shown without app updates

> "Our developers choose Flutter because it lets them quickly create expressive, brand-rich, custom design systems that feel great on every platform. A2UI was a great fit for Flutter's GenUI SDK because it ensures that every user, on every platform, gets a high quality native feeling experience."
>
> **— Vijay Menon**, Engineering Director, Dart & Flutter

**Try it:**
- [GenUI Documentation](https://docs.flutter.dev/ai/genui)
- [Getting Started Video](https://www.youtube.com/watch?v=nWr6eZKM6no)
- [Verdure Example](https://github.com/flutter/genui/tree/main/examples/verdure) (client-server A2UI sample)

---

## Partner Integrations

### AG UI / CopilotKit: Full-Stack Agentic Framework

[AG UI](https://ag-ui.com/) and [CopilotKit](https://www.copilotkit.ai/) provide a comprehensive framework for building agentic applications, with **day-zero A2UI compatibility**.

**How they work together:**

AG UI excels at creating high-bandwidth connections between custom frontends and their dedicated agents. By adding A2UI support, developers get the best of both worlds:

- **State synchronization**: AG UI handles app state and chat history
- **A2UI rendering**: Render dynamic UIs from third-party agents
- **Multi-agent support**: Coordinate UIs from multiple agents
- **React integration**: Seamless integration with React applications

> "AG UI excels at creating a high-bandwidth connection between a custom-built front-end and its dedicated agent. By adding support for A2UI, we're giving developers the best of both worlds. They can now build rich, state-synced applications that can also render dynamic UIs from third-party agents via A2UI. It's a perfect match for a multi-agent world."
>
> **— Atai Barkai**, Founder of CopilotKit and AG UI

**Learn more:**
- [AG UI](https://ag-ui.com/)
- [CopilotKit](https://www.copilotkit.ai/)

---

### Google's AI-Powered Products

As Google adopts AI across the company, A2UI provides a **standardized way for AI agents to exchange user interfaces**, not just text.

**Internal agent adoption:**

- **Multi-agent workflows**: Multiple agents contribute to the same surface
- **Remote agent support**: Agents running on different services can provide UI
- **Standardization**: Common protocol across teams reduces integration overhead
- **External exposure**: Internal agents can be easily exposed externally (e.g., Gemini Enterprise)

> "Much like A2A lets any agent talk to another agent regardless of platform, A2UI standardizes the user interface layer and supports remote agent use cases through an orchestrator. This has been incredibly powerful for internal teams, allowing them to rapidly develop agents where rich user interfaces are the norm, not the exception. As Google pushes further into generative UI, A2UI provides a perfect platform for server-driven UI that renders on any client."
>
> **— James Wren**, Senior Staff Engineer, AI Powered Google

---

## Community Projects

The A2UI community is building exciting projects:

### Open Source Examples

- **Restaurant Finder** ([samples/agent/adk/restaurant_finder](https://github.com/google/A2UI/tree/main/samples/agent/adk/restaurant_finder))
  - Table reservation with dynamic forms
  - Gemini-powered agent
  - Full source code available

- **Contact Lookup** ([samples/agent/adk/contact_lookup](https://github.com/google/A2UI/tree/main/samples/agent/adk/contact_lookup))
  - Search interface with results list
  - A2A agent example
  - Demonstrates data binding

- **Component Gallery** ([samples/client/angular - gallery mode](https://github.com/google/A2UI/tree/main/samples/client/angular))
  - Interactive showcase of all components
  - Live examples with code
  - Great for learning

### Community Contributions

Have you built something with A2UI? [Share it with the community!](../community.md)

---

## Next Steps

- [Quickstart Guide](../quickstart.md) - Try the demo
- [Agent Development](../guides/agent-development.md) - Build an agent
- [Client Setup](../guides/client-setup.md) - Integrate a renderer
- [Community](../community.md) - Join the community

---

**Using A2UI in production?** Share your story on [GitHub Discussions](https://github.com/google/A2UI/discussions).
