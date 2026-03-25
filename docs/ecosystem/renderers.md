# Ecosystem Renderers

Community and third-party A2UI renderer implementations.

!!! note
    These renderers are maintained by their respective authors, not the A2UI team.
    Check each project for compatibility, version support, and maintenance status.

## Community Renderers

| Renderer | Platform | v0.8 | v0.9 | Activity | Links |
|----------|----------|------|------|----------|-------|
| **@a2ui-sdk/react** | React (Web) | ✅ | ❌ | ![Stars](https://img.shields.io/github/stars/easyops-cn/a2ui-sdk?style=flat-square&label=⭐) ![Last commit](https://img.shields.io/github/last-commit/easyops-cn/a2ui-sdk?style=flat-square&label=updated) | [GitHub](https://github.com/easyops-cn/a2ui-sdk) · [npm](https://www.npmjs.com/package/@a2ui-sdk/react) · [Docs](https://a2ui-sdk.js.org/) |
| **A2UI-Android** | Android (Compose) | ✅ | ❌ | ![Stars](https://img.shields.io/github/stars/lmee/A2UI-Android?style=flat-square&label=⭐) ![Last commit](https://img.shields.io/github/last-commit/lmee/A2UI-Android?style=flat-square&label=updated) | [GitHub](https://github.com/lmee/A2UI-Android) |
| **a2ui-react-native** | React Native | ✅ | ❌ | ![Stars](https://img.shields.io/github/stars/sivamrudram-eng/a2ui-react-native?style=flat-square&label=⭐) ![Last commit](https://img.shields.io/github/last-commit/sivamrudram-eng/a2ui-react-native?style=flat-square&label=updated) | [GitHub](https://github.com/sivamrudram-eng/a2ui-react-native) |
| **@zhama/a2ui** | React (Web) | ✅ | ❌ | — | [npm](https://www.npmjs.com/package/@zhama/a2ui) |
| **A2UI-react** | React (Web) | ✅ | ❌ | ![Stars](https://img.shields.io/github/stars/jem-computer/A2UI-react?style=flat-square&label=⭐) ![Last commit](https://img.shields.io/github/last-commit/jem-computer/A2UI-react?style=flat-square&label=updated) | [GitHub](https://github.com/jem-computer/A2UI-react) |
| **a2ui-swiftui** | SwiftUI (iOS, iPadOS, macOS, tvOS, watchOS, visionOS) | ✅ | ✅ | ![Stars](https://img.shields.io/github/stars/BBC6BAE9/a2ui-swiftui?style=flat-square&label=⭐) ![Last commit](https://img.shields.io/github/last-commit/BBC6BAE9/a2ui-swiftui?style=flat-square&label=updated) | [GitHub](https://github.com/BBC6BAE9/a2ui-swiftui) |

### Notable Mentions

These projects are early-stage or experimental:

- **[@xpert-ai/a2ui-react](https://www.npmjs.com/package/@xpert-ai/a2ui-react)** — React renderer with ShadCN UI components (v0.0.1, published Jan 2026)
- **[a2ui-3d-renderer](https://github.com/josh-english-2k18/a2ui-3d-renderer)** — Experimental Three.js/WebGL 3D renderer for A2UI (~2 stars)
- **[ai-kit-a2ui](https://github.com/AINative-Studio/ai-kit-a2ui)** — React + ShadCN renderer for the AIKit framework (~2 stars)

### Highlights

**@a2ui-sdk/react** is currently the most mature community React renderer, with 11 published versions, Radix UI primitives, Tailwind CSS styling, and a dedicated docs site. It was [announced on the A2UI discussions](https://github.com/google/A2UI/discussions/489).

**A2UI-Android** fills an important gap — it's the only community Jetpack Compose renderer, covering Android 5.0+ with 20+ components, data binding, and accessibility support.

**a2ui-react-native** is the only React Native renderer, enabling A2UI on iOS and Android via a single codebase.

**a2ui-swiftui** is a native SwiftUI renderer supporting iOS, macOS, visionOS, watchOS, and tvOS. It covers all 18 standard A2UI components with dual v0.8 + v0.9 protocol support, includes JSONL streaming, and uses the Observation framework for reactivity.

### Python / PyPI

No credible A2UI renderer packages were found on PyPI as of March 2026. A2UI renderers are client-side (UI) libraries, so the ecosystem is naturally focused on JavaScript/TypeScript and native mobile frameworks.

## Submitting a Renderer

Built an A2UI renderer? We'd love to list it here.

### How to submit

1. **Fork** the [google/A2UI](https://github.com/google/A2UI) repository
2. **Edit** this file (`docs/ecosystem/renderers.md`) — add a row to the Community Renderers table with your renderer's name, platform, npm package (if any), version support, and a link to the source
3. **Open a PR** against `google/A2UI` with a short description of your renderer
4. **Post in [GitHub Discussions](https://github.com/google/A2UI/discussions)** — let the community know what you built! A short demo video goes a long way.

Need inspiration? Browse the **[community samples](https://github.com/google/A2UI/tree/main/samples)** in the repo — these cover Angular, Lit, and ADK-based agents and are a good starting point.

### What makes a good community renderer?

A listing is more likely to be accepted and used if it:

- Has **published source code** (open-source preferred, MIT or Apache 2.0)
- Clearly states **which A2UI spec version** it supports (v0.8, v0.9, or both)
- Covers **core components**: text, buttons, inputs, and basic layout
- Includes a **README** with install instructions and a minimal usage example
- Is **actively maintained** — flag it as archived if you're no longer supporting it

Community renderers don't need to be production-ready to be listed — experimental and early-stage projects are welcome in the Notable Mentions section.
