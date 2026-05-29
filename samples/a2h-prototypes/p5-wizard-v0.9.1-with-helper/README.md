# P5 — Multi-step Expense Report Wizard (v0.9.1)

**Intent sequence:** COLLECT → COLLECT → INFORM → AUTHORIZE

## The Dramatic Difference

This is the same expense wizard as v0.9.0, but rebuilt with v0.9.1 features. The improvement is transformative — this is the prototype where the spec enhancements pay off the most.

### v0.9.0 vs v0.9.1 — Side by Side

| Metric | v0.9.0 | v0.9.1 | Improvement |
|--------|--------|--------|-------------|
| **Total messages** | 6 | 3 | **50% fewer** |
| **updateComponents calls** | 4 (one per step) | 1 (initial only) | **75% reduction** |
| **Mid-flow updateComponents** | 4 | **0** | **100% eliminated** |
| **Review step components** | 21 (7× Row+Text+Text) | 7 (KeyValue) | **67% fewer** |
| **Button components** | 12 (6× Button+Text) | 6 (Button.label) | **50% fewer** |
| **Step transition cost** | Full tree rebuild | Data model update | **Zero DOM surgery** |
| **Back navigation** | Replay all messages to target | Set currentStep = N | **Instant** |

### How Step Transitions Work

**v0.9.0:** Each step requires a full `updateComponents` message containing every component for that step. Going from step 1 to step 2 means sending ~20 components. Going back means the renderer must replay messages from scratch.

**v0.9.1:** All 4 steps exist in the initial component tree. Each step container has a `visible` binding:

```json
{
  "id": "step2-container",
  "component": "Column",
  "visible": { "fn": "equals", "args": [{ "path": "/wizard/currentStep" }, 2] },
  "children": ["s2-title", "s2-desc", "s2-receipt", "s2-vendor", "s2-notes", ...]
}
```

Navigating from step 1 to step 2 is just:
```json
{ "updateDataModel": { "value": { "wizard": { "currentStep": 2 } } } }
```

That's it. The renderer hides step 1, shows step 2. No component tree manipulation. Back navigation is the same — set `currentStep` back to 1.

## v0.9.1 Features Used

### 1. `visible` Binding (THE Game Changer)

All 4 wizard steps + a processing spinner exist in the initial tree. Only the active step is visible. Step transitions are pure data model updates. This single feature eliminates 4 of 6 messages from v0.9.0.

### 2. KeyValue Component

The review step (step 3) shows 7 key-value pairs. In v0.9.0, each pair required 3 components (Row + label Text + value Text) = 21 components. In v0.9.1, each pair is one KeyValue component = 7 components.

```json
{ "id": "rev-amount", "component": "KeyValue", "label": "Amount", "value": { "path": "/expense/amount" } }
```

### 3. Button `label` Prop

Every button in v0.9.0 required a child Text component (2 components, 2 IDs per button). v0.9.1 buttons use `label` directly:

```json
{ "id": "btn-next", "component": "Button", "label": "Next →", "variant": "primary", "action": { ... } }
```

6 buttons × 1 saved component = 6 fewer components.

### 4. ProgressIndicator

After the user clicks "Submit Expense" on step 4, a processing state (step 5) shows a native spinner:

```json
{ "id": "submit-spinner", "component": "ProgressIndicator", "mode": "indeterminate" }
```

In v0.9.0, this would have required yet another `updateComponents` message. In v0.9.1, it's just `currentStep: 5` and the spinner container becomes visible.

## Message Structure

```
Message 1: createSurface (sendDataModel: true)
Message 2: updateComponents — ALL steps in one tree
             step1-container (visible: currentStep === 1) — COLLECT form
             step2-container (visible: currentStep === 2) — COLLECT form
             step3-container (visible: currentStep === 3) — INFORM review (KeyValue)
             step4-container (visible: currentStep === 4) — AUTHORIZE
             submit-processing (visible: currentStep === 5) — ProgressIndicator
Message 3: updateDataModel — initial state, currentStep: 1

--- After initial setup, navigation is JUST data model updates ---
User clicks "Next →": updateDataModel { currentStep: 2 }
User clicks "Next →": updateDataModel { currentStep: 3 }
User clicks "← Back": updateDataModel { currentStep: 2 }  ← instant!
...
```

## Steps

| Step | Intent | Purpose | v0.9.1 Features |
|------|--------|---------|-----------------|
| 1 | COLLECT | Expense basics: date, category, amount, description | visible binding, Button.label |
| 2 | COLLECT | Receipt details: receipt number, vendor, notes | visible binding, Button.label |
| 3 | INFORM | Read-only review of all collected data | visible binding, **KeyValue** |
| 4 | AUTHORIZE | Final approval with policy compliance note | visible binding, Button.label, KeyValue |
| 5 | — | Processing state after submission | visible binding, **ProgressIndicator** |

## Data Model

```json
{
  "wizard": {
    "currentStep": 1,
    "stepLabel": "Step 1 of 4 — Expense Details",
    "interactionId": "exp-2026-0304-001",
    "processingLabel": "Submitting expense report…"
  },
  "expense": {
    "date": "", "category": [], "amount": "",
    "description": "", "receiptNumber": "", "vendor": "", "notes": ""
  }
}
```

The `wizard.currentStep` field drives ALL visibility. The `wizard.stepLabel` field drives the step indicator text. Everything else is form data that accumulates across steps and persists through `sendDataModel: true`.

## Events

- `a2h.wizard.next` — Advance to next step (renderer sets currentStep + 1)
- `a2h.wizard.back` — Go to previous step (renderer sets currentStep - 1)
- `a2h.authorize.approve` — Submit (shows processing spinner, then completes)
- `a2h.authorize.reject` — Cancel the expense report

## Why This Matters

The wizard is the most complex A2H interaction pattern — it chains multiple intents across multiple steps with shared state. It's where v0.9.0's limitations hurt the most (verbose, error-prone step rebuilds) and where v0.9.1's enhancements shine brightest.

The visible binding pattern means an agent can declare the **entire interaction upfront** — all possible states, all possible transitions — in a single `updateComponents` message. The conversation then becomes purely about data flow: the agent sends data, the human fills in data, and the UI reacts automatically. No more micromanaging the component tree.

This is the difference between imperative UI ("replace these components with those components") and declarative UI ("here's the structure; the data model drives what's visible"). v0.9.1 makes A2UI declarative.

## Running

```bash
python3 -m http.server 8080
# Open http://localhost:8080
```
