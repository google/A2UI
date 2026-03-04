# P5 — Multi-step Expense Report Wizard

**Intent sequence:** COLLECT → COLLECT → INFORM → AUTHORIZE

## What This Demonstrates

A multi-step wizard where an agent guides a user through submitting an expense report. Each step is a separate `updateComponents` message that swaps the visible UI content on a single persistent surface. The data model accumulates across all steps.

### Steps

| Step | Intent    | Purpose |
|------|-----------|---------|
| 1    | COLLECT   | Expense basics: date, category, amount, description |
| 2    | COLLECT   | Receipt details: receipt number, vendor, notes |
| 3    | INFORM    | Read-only review of all collected data |
| 4    | AUTHORIZE | Final approval with policy compliance note |

### Message Structure

```
createSurface (sendDataModel: true)
updateDataModel (initial empty fields)
updateComponents — Step 1 (COLLECT form)
updateComponents — Step 2 (COLLECT form, replaces step 1 fields)
updateComponents — Step 3 (INFORM review, read-only Text bindings)
updateComponents — Step 4 (AUTHORIZE with lock icon + submit/cancel)
```

Each `updateComponents` message replaces the `main-col` children list, swapping which fields/content are visible. Shared component IDs (`step-indicator`, `step-title`, `actions`) get overwritten each step. Step-specific components (form fields, review rows) are added fresh.

### Data Model

```json
{
  "expense": {
    "date": "", "category": "", "amount": "",
    "description": "", "receiptNumber": "", "vendor": "", "notes": ""
  },
  "meta": { "interactionId": "...", "currentStep": 1, "totalSteps": 4 }
}
```

All fields live under `/expense/*`. The renderer accumulates values as users fill in each step. With `sendDataModel: true`, every button event carries the full model.

### Events

- `a2h.collect.submit` — Step 1, 2: advance to next step
- `a2h.wizard.back` — Navigate backward
- `a2h.inform.acknowledge` — Step 3: proceed to authorization
- `a2h.authorize.approve` / `a2h.authorize.reject` — Step 4: final decision

## What Works Well

- **Single surface, swapped content**: `updateComponents` elegantly replaces the UI for each step while preserving the data model
- **Data model accumulation**: Fields from step 1 persist through step 4; review step reads them back via `{path: ...}` bindings
- **Step indicator**: Simple Text component at top tracks progress ("Step 2 of 4")
- **sendDataModel: true**: The entire form state ships with every event — the agent/server always has the full picture
- **Consistent layout**: Reusing IDs like `main-col`, `actions`, `step-title` means the card structure stays stable across steps

## What's Painful

- **No wizard/stepper component**: There's no native `Stepper` or `Tabs` in the v0.9 catalog. Step indicator is just a Text string — no visual progress bar, no clickable breadcrumbs
- **No field validation between steps**: Can't prevent advancing from step 1 to step 2 if required fields are empty. Would need Checkable trait wired to button enabled state, but cross-field validation (e.g., "amount must be numeric") is limited
- **No conditional visibility**: Can't show/hide the policy warning based on amount > $500. It's always visible. Would need `when` or `visible` property
- **Component ID collisions**: Steps share IDs to enable overwrite, but this is a convention hack — if step 2 forgets to redeclare `actions`, it inherits step 1's version. Error-prone
- **No file upload**: A2UI v0.9 has no file input component. Receipt "upload" is faked with text fields
- **Verbose**: Each review row needs 3 components (Row + label Text + value Text). A `KeyValue` or `Table` component would cut this dramatically
- **No transition animation**: Step changes are instant DOM swaps. A `Wizard` container could provide slide/fade transitions
- **Back navigation rebuilds from scratch**: To go back, the renderer must replay all messages up to the target step. No undo/snapshot mechanism in the protocol

## Running

```bash
# From this directory:
python3 -m http.server 8080
# Open http://localhost:8080
```

Or open `index.html` directly (needs a local server for fetch).
