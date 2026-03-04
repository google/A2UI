# Prototype 1 — Approval Card (AUTHORIZE Intent)

## A2H Intent: AUTHORIZE

Maps to the **AUTHORIZE** intent from the [A2H protocol](https://github.com/anthropics/anthropic-cookbook/blob/main/misc/prompt_caching.ipynb) (Twilio's Agent-to-Human specification). This intent represents an agent requesting human approval before performing a sensitive or irreversible action.

## Scenario

A financial assistant agent wants to transfer $500 from a checking account to a savings account. The human must explicitly approve or reject the action before it proceeds.

## Files

| File | Purpose |
|------|---------|
| `authorize-transfer.json` | A2UI v0.9 message sequence (createSurface + updateComponents + updateDataModel) |
| `index.html` | Standalone renderer demo — no build step, opens in any browser |

## Running

```bash
# Any static file server works
cd samples/a2h-prototypes/p1-approval-v0.9.0
python3 -m http.server 8080
# Open http://localhost:8080
```

## A2UI v0.9 Patterns Used

- **`createSurface` with `sendDataModel: true`** — ensures the full data model is sent back with every button event, so the agent receives all transfer metadata alongside the approve/reject decision
- **Data binding via `{"path": "/transfer/amount"}`** — transfer details are in the data model, not hardcoded in component text
- **Event actions on buttons** — `a2h.authorize.approve` and `a2h.authorize.reject` event names with context carrying `interactionId` (bound from data model)
- **Nested Card** — detail rows in a nested card for visual grouping
- **TTL indicator** — caption text showing expiration (static in this prototype)

## What Works

- ✅ Clean visual representation of an approval flow
- ✅ Data model correctly separates transfer data from presentation
- ✅ Button events carry resolved context (interactionId from data model)
- ✅ `sendDataModel: true` means the agent gets full context on any interaction
- ✅ Standard v0.9 components only — no custom catalog needed

## What's Missing / Gaps Found

1. **No Lit renderer for v0.9** — The `@a2ui/lit` renderer only supports v0.8. The `@a2ui/web_core` has v0.9 state/data-model code but no rendering layer. This prototype uses a standalone vanilla JS renderer instead.
2. **No TTL/countdown component** — The expiration is a static text string. A real AUTHORIZE flow needs a live countdown or at minimum a `validUntil` field that the renderer can auto-expire.
3. **No button disable after click** — Once approved/rejected, buttons should be disabled and the card should show a "Decision recorded" state. A2UI v0.9 has no built-in mechanism for client-side state transitions without a server round-trip.
4. **No severity/risk theming** — The AUTHORIZE intent should convey risk level (low/medium/high). The v0.9 theme supports `primaryColor` but there's no standard convention for mapping risk → color.
5. **No auth evidence** — A2H AUTHORIZE can carry authentication proof (biometric, PIN). A2UI has no component for this — it would need a custom catalog extension.
6. **Button variant limited** — Only "primary" variant exists. A "destructive" or "danger" variant would be useful for high-risk authorizations.

## Event Payload Example

When the user clicks **Approve**, the event payload sent to the agent:

```json
{
  "eventName": "a2h.authorize.approve",
  "context": {
    "interactionId": "txn-2026-0304-001",
    "intent": "AUTHORIZE"
  },
  "dataModel": {
    "transfer": {
      "description": "Your financial agent wants to transfer funds between your accounts.",
      "action": "Transfer Funds",
      "fromAccount": "Checking (****4521)",
      "toAccount": "Savings (****7890)",
      "amount": "$500.00"
    },
    "meta": {
      "interactionId": "txn-2026-0304-001",
      "agentId": "financial-assistant-v2",
      "intent": "AUTHORIZE",
      "timestamp": "2026-03-04T06:45:00Z",
      "ttlSeconds": 300
    }
  }
}
```
