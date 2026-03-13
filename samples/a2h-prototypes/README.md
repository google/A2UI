# A2H × A2UI Prototypes

Exploration of rendering [A2H](https://github.com/twilio-labs/Agent2Human) (Agent-to-Human) intents using the A2UI v0.9 protocol. Five working prototypes validate the mapping between A2H's five intent types and A2UI's component model.

## Quick Start

Open the all-in-one demo:

```bash
cd demo && npx serve .
# Or just open demo/index.html in your browser
```

## Two Versions

Each prototype has (or will have) two versions:

- **`*-v0.9.0`** — Built with the current A2UI v0.9 spec only. No spec changes required. Shows what's possible today, including workarounds for missing features.
- **`*-v0.9.1-with-helper`** — Built with proposed spec additions (`visible` binding, button `label`, ProgressIndicator, KeyValue) plus the `a2h-a2ui` helper library. Shows what's possible with small, targeted improvements to the spec.

Comparing the two versions side-by-side makes the case for each proposed enhancement concrete and measurable.

## Contents

| Path | Description |
|------|-------------|
| [DESIGN.md](./DESIGN.md) | Full design document — intent mapping, conventions, v0.9.0 vs v0.9.1 comparison |
| [demo/](./demo/) | **All 5 intents on one page**, generated via the helper library |
| [lib/a2h-a2ui.js](./lib/a2h-a2ui.js) | Helper library — generates A2UI v0.9 messages from A2H intent descriptions |

### v0.9.0 Prototypes (current spec)

| Path | Intent | Description |
|------|--------|-------------|
| [p1-approval-v0.9.0/](./p1-approval-v0.9.0/) | AUTHORIZE | Financial transfer approval card |
| [p2-escalation-v0.9.0/](./p2-escalation-v0.9.0/) | ESCALATE | Customer service handoff |
| [p3-guided-input-v0.9.0/](./p3-guided-input-v0.9.0/) | COLLECT | Shipping address form (⭐ cleanest prototype) |
| [p4-progress-intervention-v0.9.0/](./p4-progress-intervention-v0.9.0/) | INFORM → AUTHORIZE | Deploy pipeline with progressive updates |
| [p5-wizard-v0.9.0/](./p5-wizard-v0.9.0/) | COLLECT×2 → INFORM → AUTHORIZE | Expense report wizard |

### v0.9.1 Prototypes (proposed enhancements)

| Path | Intent | Description |
|------|--------|-------------|
| [p1-approval-v0.9.1-with-helper/](./p1-approval-v0.9.1-with-helper/) | AUTHORIZE | Same approval card — 25% fewer components |
| [p2-escalation-v0.9.1-with-helper/](./p2-escalation-v0.9.1-with-helper/) | ESCALATE | Same escalation — 22% fewer components |
| [p3-guided-input-v0.9.1-with-helper/](./p3-guided-input-v0.9.1-with-helper/) | COLLECT | Same form + review-before-submit flow (4 states) |
| [p4-progress-intervention-v0.9.1-with-helper/](./p4-progress-intervention-v0.9.1-with-helper/) | INFORM → AUTHORIZE | Same pipeline — zero mid-flow updateComponents |
| [p5-wizard-v0.9.1-with-helper/](./p5-wizard-v0.9.1-with-helper/) | COLLECT×2 → INFORM → AUTHORIZE | Same wizard — 50% fewer messages |

## Helper Library API

```js
import {
  createAuthorizeSurface,
  createCollectSurface,
  createInformSurface,
  createEscalateSurface,
  createResultSurface,
} from './lib/a2h-a2ui.js';

const messages = createAuthorizeSurface({
  surfaceId: 'a2h:authorize:001',
  title: 'Authorization Required',
  description: 'Agent wants to book a flight.',
  details: [{ label: 'Amount', path: '/amount' }],
  dataModel: { amount: '$450.00' },
});
// Returns: [createSurface, updateDataModel, updateComponents] — valid A2UI v0.9
```

Each function returns an array of A2UI v0.9 messages with valid component IDs, `catalogId: "basic"`, proper data bindings, and `sendDataModel: true` on interactive surfaces.

## Key Findings

- **`sendDataModel: true`** is the key enabler — eliminates per-field wiring for forms and approvals
- **Data binding** (`{path: "/foo"}`) provides clean two-way binding
- **Incremental updates** via `updateComponents` merge enables real-time progress UIs
- **A2UI v0.9 covers ~80%** of A2H rendering needs today

## Proposed A2UI Enhancements

1. **`visible` binding** — Conditional rendering (eliminates tree-swap workarounds)
2. **Button `label` prop** — Kills 2-component-per-button boilerplate (~15-20% reduction)
3. **ProgressIndicator** — Proper loading/progress states
4. **KeyValue component** — Eliminates 3-component-per-detail-row pattern

See [DESIGN.md](./DESIGN.md) for full analysis.

## Status

**Exploration / proof-of-concept.** Prototypes are static HTML+JS with inline renderers. The helper library generates valid A2UI v0.9 but is not yet published as an npm package. Next steps: propose enhancements to the A2UI spec, port to real renderers (Lit/Angular/Flutter).
