# P4: Progress with Intervention — v0.9.1 with Helper

**The most dramatic improvement of any prototype.** The `visible` binding eliminates ALL mid-flow `updateComponents` messages, reducing the pipeline from 9 messages to 6 — and from 4 component rebuilds to zero.

## What Changed from v0.9.0

### The Core Problem (v0.9.0)
Every pipeline step transition required **two messages**: an `updateDataModel` for state AND an `updateComponents` to swap emoji icons (⬜→⏳→✅) and update labels. When the deploy step needed approval, yet another `updateComponents` injected the entire approval card by restructuring the `children` array.

### The v0.9.1 Solution

| Feature | Before (v0.9.0) | After (v0.9.1) |
|---------|-----------------|-----------------|
| Step status | Emoji text swap via updateComponents (⬜⏳✅) | **ProgressIndicator** bound to data model `mode` |
| Step labels | updateComponents per step | **Text** with `{ "path": "/steps/build/label" }` |
| Approval card | Injected via updateComponents (restructure children) | **`visible` binding** — in initial tree, hidden until needed |
| Metadata | Text components (Row + Text + Text) | **KeyValue** component |
| Button labels | Text child + Button (2 components each) | **Button `label` prop** (1 component each) |

### Message Count Comparison

```
v0.9.0:  9 messages
  ├── createSurface           (1)
  ├── updateDataModel         (4)  — one per step
  └── updateComponents        (4)  — one per step (emoji swaps + approval card injection)

v0.9.1:  6 messages
  ├── createSurface           (1)
  ├── updateComponents        (1)  — initial tree (includes hidden approval card)
  └── updateDataModel         (4)  — one per step (ALL state changes are data-only!)
```

**Key insight:** After the initial `updateComponents`, the entire pipeline runs on pure data model updates. The `visible` binding on the approval card means it appears automatically when `/approvalVisible` flips to `true` — no component tree surgery needed.

### Component Count

| | v0.9.0 | v0.9.1 | Reduction |
|---|--------|--------|-----------|
| Step indicators | 8 (icon + label × 4) | 8 (progress + label × 4) | Same count, but native widget |
| Metadata | 4 (Column + 2× Text) | 5 (Card + Column + 3× KeyValue) | Richer display |
| Approval buttons | 4 (2× Text + 2× Button) | 2 (2× Button with `label`) | **50% fewer** |
| Total updateComponents after init | **4** | **0** | **100% eliminated** |

## Files

| File | Description |
|------|-------------|
| `deploy-pipeline.json` | v0.9.1 message sequence — 6 messages with ProgressIndicator, visible binding, KeyValue |
| `pipeline-with-helper.js` | Helper library usage showing how data model updates drive the entire pipeline |
| `index.html` | Interactive renderer with timed playback, message log, and event log |

## How visible Binding Works

The approval card is declared in the initial component tree:

```json
{
  "id": "approve-card",
  "component": "Card",
  "child": "approve-col",
  "visible": { "fn": "equals", "args": [{ "path": "/approvalVisible" }, true] }
}
```

When the data model has `"approvalVisible": false`, the card is hidden. When the pipeline reaches the deploy step, a single `updateDataModel` sets `"approvalVisible": true` and the card appears. No `updateComponents` message needed.

This is the pattern that makes v0.9.1 transformative for stateful UIs like pipelines — **declare the full UI upfront, drive everything through data**.

## Running

Open `index.html` in a browser. The pipeline steps play automatically with realistic timing. Click "Approve" or "Rollback" when the approval card appears to see event payloads.
