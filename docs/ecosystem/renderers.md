# Ecosystem Renderers

Community and third-party A2UI renderer implementations.

!!! note
    These renderers are maintained by their respective authors, not the A2UI team.
    Check each project for compatibility, version support, and maintenance status.

## Community Renderers

| Renderer | Platform | npm / Package | v0.8 | v0.9 | Stars | Last Updated | Links |
|----------|----------|---------------|------|------|-------|-------------|-------|
| **@a2ui-sdk/react** | React (Web) | `@a2ui-sdk/react` | ✅ | ❌ | ~20 | Feb 2026 | [GitHub](https://github.com/easyops-cn/a2ui-sdk) · [npm](https://www.npmjs.com/package/@a2ui-sdk/react) · [Docs](https://a2ui-sdk.js.org/) |
| **A2UI-Android** | Android (Jetpack Compose) | — | ✅ | ❌ | ~15 | Feb 2026 | [GitHub](https://github.com/lmee/A2UI-Android) |
| **a2ui-react-native** | React Native (Mobile) | — | ✅ | ❌ | ~9 | Feb 2026 | [GitHub](https://github.com/sivamrudram-eng/a2ui-react-native) |
| **@zhama/a2ui** | React (Web) | `@zhama/a2ui` | ✅ | ❌ | — | Jan 2026 | [npm](https://www.npmjs.com/package/@zhama/a2ui) |
| **A2UI-react** | React (Web) | — | ✅ | ❌ | ~9 | Feb 2026 | [GitHub](https://github.com/jem-computer/A2UI-react) |

### Notable Mentions

These projects are early-stage or experimental:

- **[@xpert-ai/a2ui-react](https://www.npmjs.com/package/@xpert-ai/a2ui-react)** — React renderer with ShadCN UI components (v0.0.1, published Jan 2026)
- **[a2ui-3d-renderer](https://github.com/josh-english-2k18/a2ui-3d-renderer)** — Experimental Three.js/WebGL 3D renderer for A2UI (~2 stars)
- **[ai-kit-a2ui](https://github.com/AINative-Studio/ai-kit-a2ui)** — React + ShadCN renderer for the AIKit framework (~2 stars)

### Highlights

**@a2ui-sdk/react** is currently the most mature community React renderer, with 11 published versions, Radix UI primitives, Tailwind CSS styling, and a dedicated docs site. It was [announced on the A2UI discussions](https://github.com/google/A2UI/discussions/489).

**A2UI-Android** fills an important gap — it's the only community Jetpack Compose renderer, covering Android 5.0+ with 20+ components, data binding, and accessibility support.

**a2ui-react-native** is the only React Native renderer, enabling A2UI on iOS and Android via a single codebase.

### Python / PyPI

No credible A2UI renderer packages were found on PyPI as of March 2026. A2UI renderers are client-side (UI) libraries, so the ecosystem is naturally focused on JavaScript/TypeScript and native mobile frameworks.

## Submitting a Renderer

Built an A2UI renderer? We'd love to list it here:

1. Open a PR to add it to this page
2. Or file an issue on the [A2UI repo](https://github.com/google/A2UI)

### What makes a good community renderer?

- Published source code (open-source preferred)
- Clear documentation on which A2UI spec version is supported
- At least basic component coverage (text, buttons, inputs, layout)
- Active maintenance
