# P4 — Status/Progress with Human Intervention Points

## Pattern: INFORM → AUTHORIZE

This prototype demonstrates a deployment pipeline that **progressively updates** the UI as steps complete, then **pauses for human approval** before the final deploy step.

The two A2H interaction types used:

- **INFORM** — Steps 1–3 use `updateComponents` to show real-time progress (Build ✅ → Test ✅ → Stage ✅). The human observes but doesn't act.
- **AUTHORIZE** — Step 4 pauses the pipeline and injects an approval card with Approve/Rollback buttons. The pipeline cannot proceed without human input.

## How It Works

### Message Sequence (4 messages in `deploy-pipeline.json`)

1. **createSurface + initial state** — Pipeline header, app info, four steps all pending (Build ⏳, rest ⬜)
2. **updateComponents** — Build ✅ complete (1m 12s), Test ⏳ running
3. **updateComponents** — Test ✅ passed (48/48), Stage ⏳ running
4. **updateComponents** — Stage ✅ live, Deploy ⏸️ paused. Approval card injected into the tree by updating `main-col.children` to include `approve-card`.

### Key Techniques

- **Progressive UI via `updateComponents`**: Only changed component IDs are sent each step. The renderer merges them into the existing tree and re-renders.
- **Dynamic tree structure**: Step 4 updates `main-col.children` to append new components (divider + approval card), demonstrating that layout itself can change, not just props.
- **Data model tracks pipeline state**: Each message includes `updateDataModel` with step statuses, timestamps, and artifacts. Buttons use `{"path": ...}` bindings to resolve context from the data model.
- **Emoji icons for status**: ✅ ⏳ ⏸️ ⬜ — simple, universal, no icon font dependency.

### Renderer (`index.html`)

Replays the 4 messages with 2–3 second delays between steps, simulating real-time progress. A status bar shows the current phase. The approval card buttons emit events to the event log.

## Identified Gaps in A2UI v0.9

| Gap | Impact | Workaround |
|-----|--------|------------|
| No native progress bar component | Can't show % completion or animated bars | Used emoji icons + text labels |
| No animation/transition support | Step changes are instantaneous, not smooth | Full re-render; could add CSS transitions in renderer |
| No conditional rendering / visibility toggle | Can't hide approval card until needed; must restructure children | Updated `main-col.children` array to add components |
| No timer/auto-refresh primitive | Agent must push each update; no client-side polling | Renderer uses setTimeout to simulate; real impl needs server-push |
| `updateDataModel` replaces entire model | No partial/merge — agent must resend full data model each step | Acceptable for small models; problematic at scale |

## Files

- `deploy-pipeline.json` — A2UI v0.9 message sequence (4 messages)
- `index.html` — Standalone renderer with replay simulation
- `README.md` — This file
