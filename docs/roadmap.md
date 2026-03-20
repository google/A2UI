# Roadmap

This roadmap outlines the current state and future plans for the A2UI project. The project is under active development, and priorities may shift based on community feedback and emerging use cases.

## Current Status

### Protocol

| Version | Status | Notes |
|---------|--------|-------|
| **v0.8** | ✅ Stable | Initial public release |
| **v0.9** | 🚧 Draft | Prompt-First specification improvements |

Key features:

- ✅ Streaming JSONL message format
- ✅ Four core message types (`surfaceUpdate`, `dataModelUpdate`, `beginRendering`, `deleteSurface`)
- ✅ Adjacency list component model
- ✅ JSON Pointer-based data binding
- ✅ Separation of structure and state

### Renderers

| Client libraries | Status | Platform | Notes |
|-----------------|--------|----------|-------|
| **Web Components (Lit)** | ✅ Stable | Web | Framework-agnostic, works anywhere |
| **Angular** | ✅ Stable | Web | Full Angular integration |
| **Flutter (GenUI SDK)** | ✅ Stable | Multi-platform | Works on mobile, web, desktop |
| **React** | 🚧 In Progress | Web | Coming Q1 2026 |
| **SwiftUI** | 📋 Planned | iOS/macOS | Planned for Q2 2026 |
| **Jetpack Compose** | 📋 Planned | Android | Planned for Q2 2026 |
| **Vue** | 💡 Proposed | Web | Community interest |
| [**Svelte/Kit**](https://svelte.dev/docs/kit/introduction) | 💡 Proposed | Web | [Community interest](https://news.ycombinator.com/item?id=46287728) |
| **ShadCN (React)** | 💡 Proposed | Web | Community interest |

### Transports

| Transport | Status | Notes |
|-------------|--------|-------|
| **A2A Protocol** | ✅ Complete | Native A2A transport |
| **AG UI** | ✅ Complete | Day-zero compatibility |
| **REST API** | 📋 Planned | Bidirectional communication |
| **WebSockets** | 💡 Proposed | Bidirectional communication |
| **SSE (Server-Sent Events)** | 💡 Proposed | Web streaming |
| **MCP (Model Context Protocol)** | 💡 Proposed | Community interest |

### Agent UI toolkits

| Agent UI toolkit | Status | Notes |
|-------------|--------|-------|
| **CopilotKit** | ✅ Complete | Day-zero compatibility thanks to AG UI |
| **Open AI ChatKit** | 💡 Proposed | Community interest |
| **Vecel AI SDK UI** | 💡 Proposed | Community interest |

### Agent frameworks

| Integration | Status | Notes |
|-------------|--------|-------|
| **Any agent with A2A support** | ✅ Complete | Day-zero compatibility thanks to A2A protocol |
| **ADK** | 📋 Planned | Still designing developer ergonomics, see [samples](https://github.com/google/A2UI/tree/main/samples/agent/adk) |
| **Genkit** | 💡 Proposed | Community interest |
| **LangGraph** | 💡 Proposed | Community interest |
| **CrewAI** | 💡 Proposed | Community interest |
| **AG2** | 💡 Proposed | Community interest |
| **Claude Agent SDK** | 💡 Proposed | Community interest |
| **OpenAI Agent SDK** | 💡 Proposed | Community interest |
| **Microsoft Agent Framework** | 💡 Proposed | Community interest |
| **AWS Strands Agent SDK** | 💡 Proposed | Community interest |

## Recent Milestones

### Q2 2025

Many research projects across multiple Google teams, including integration into internal products and agents.

### Q4 2025

- v0.8.0 spec released
- A2A extension (thanks Google A2A team! teased at [a2asummit.ai](https://a2asummit.ai))
- Flutter renderer (thanks Flutter team!)
- Angular renderer (thanks Angular team!)
- Web components (Lit) renderer (thanks Opal team & friends!)
- AG UI / CopilotKit integration (thanks CopilotKit team!)
- Github public release (Apache 2.0)

## Upcoming Milestones

### Q1 2026

#### A2UI v0.9

- Release candidate for spec 0.9
- Improve theming support for renderers (complete)
- Improve server side theming support for agents (minimal)
- Improve developer ergonomics

#### React Renderer

A native React renderer with hooks-based API and full TypeScript support.

- React support for common widgets
- React support for custom components
- `useA2UI` hook for message handling
- React support for theming

### Q2 2026

#### Native Mobile Renderers

Native renderers for iOS and Android platforms.

**SwiftUI Renderer (iOS/macOS):**

- Native SwiftUI components
- iOS design language support
- macOS compatibility

**Jetpack Compose Renderer (Android):**

- Native Compose UI components
- Material Design 3 support
- Android platform integration

#### Performance Optimizations

- Renderer performance benchmarks
- Lazy loading for large component trees
- Virtual scrolling for lists
- Component memoization strategies

### Q4 2026

#### Protocol v1.0

Finalize v1.0 of the protocol with:

- Stability guarantees
- Migration path from v0.9
- Comprehensive test suite
- Certification program for renderers

## Long-Term Vision

### Multi-Agent Coordination

Enhanced support for multiple agents contributing to the same UI:

- Recommended agent composition patterns
- Conflict resolution strategies
- Shared surface management

### Accessibility Features

First-class accessibility support:

- ARIA attribute generation
- Screen reader optimization
- Keyboard navigation standards
- Contrast and color guidance

### Advanced UI Patterns

Support for more complex UI interactions:

- Drag and drop
- Gestures and animations
- 3D rendering
- AR/VR interfaces (exploratory)

### Ecosystem Growth

- More framework integrations
- Third-party component libraries
- Agent marketplace integration
- Enterprise features and support

## Community Requests

Features requested by the community (in no particular order):

- **More renderer integrations**: Map from your client library to A2UI
- **More agent frameworks**: Map from your agent framework to A2UI
- **More transports**: Map from your transport to A2UI
- **Community component library**: Share custom components with the community
- **Community samples**: Share custom samples with the community
- **Community evaluations**: Generative UI evaluation scenarios and labeled datasets
- **Developer Ergonomics**: If you can build a better A2UI experience, share it with the community

## How to Influence the Roadmap

We welcome community input on priorities:

1. **Vote on Issues**: Give 👍 to GitHub issues you care about
2. **Propose Features**: Open a discussion on GitHub (search for existing discussions first)
3. **Submit PRs**: Build the features you need (search for existing PRs first)
4. **Join Discussions**: Share your use cases and requirements (search for existing discussions first)

## Release Cycle

- **Major versions** (1.0, 2.0): Annual or when significant breaking changes are needed
- **Minor versions** (1.1, 1.2): Quarterly with new features
- **Patch versions** (1.1.1, 1.1.2): As needed for bug fixes

## Versioning Policy

A2UI follows [Semantic Versioning](https://semver.org/):

- **MAJOR**: Incompatible protocol changes
- **MINOR**: Backward-compatible functionality additions
- **PATCH**: Backward-compatible bug fixes

## Get Involved

Want to contribute to the roadmap?

- **Propose features** in [GitHub Discussions](https://github.com/google/A2UI/discussions)
- **Build prototypes** and share them with the community
- **Join the conversation** on GitHub Issues

## Stay Updated

- Watch the [GitHub repository](https://github.com/google/A2UI) for updates
- Star the repo to show your support
- Follow releases to get notified of new versions

---

**Last Updated:** March 2026

Have questions about the roadmap? [Start a discussion on GitHub](https://github.com/google/A2UI/discussions).
