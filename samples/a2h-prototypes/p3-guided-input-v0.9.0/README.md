# Prototype 3 — Guided Input / Form Collection (COLLECT)

## A2H Intent: COLLECT

The agent needs structured data from the user — in this case, shipping details for an order. Rather than asking free-text questions one at a time, the agent sends a guided form surface that feels conversational but captures structured, validated data.

## What's in this prototype

| File | Purpose |
|------|---------|
| `collect-shipping.json` | A2UI v0.9 message sequence defining the form surface |
| `index.html` | Standalone vanilla JS renderer (no build step) |

### To run

```bash
# Any static file server works
cd samples/a2h-prototypes/p3-guided-input
python3 -m http.server 8080
# Open http://localhost:8080
```

## How COLLECT maps to A2UI v0.9

The COLLECT intent translates to a surface with:

1. **`createSurface`** with `sendDataModel: true` — tells the host that when an event fires, the entire data model should be included in the payload sent back to the agent.
2. **`TextField` components** with `value: {"path": "/shipping/name"}` — each field reads from and writes to a path in the data model. This is two-way binding: pre-populated values show up, user edits flow back.
3. **`MultipleChoice`** for constrained selections (delivery speed) — also data-bound.
4. **`Button`** with an event action — on click, the renderer collects the current data model and sends it as the event payload.
5. **`updateDataModel`** pre-populates known info (saved address from user profile).

### Message sequence

```
createSurface  →  "I'm creating a form surface, send data model back on events"
updateComponents →  "Here are the form fields, layout, and submit button"
updateDataModel  →  "Pre-fill with what we already know about the user"
```

## What `sendDataModel` enables

When `sendDataModel: true` is set on the surface, every event fired from that surface includes the full data model snapshot. This means:

- **The agent gets structured data** — not free text, not parsed intent, but a clean JSON object with typed fields at known paths.
- **Pre-population works naturally** — the agent sets known values, the user corrects what's wrong, the agent gets back the final state.
- **Multiple fields in one round-trip** — instead of 6 back-and-forth messages to collect name/address/city/state/zip/phone, one surface captures everything.

Example payload the agent receives on submit:

```json
{
  "eventName": "submitShipping",
  "dataModel": {
    "shipping": {
      "name": "Jane Doe",
      "street": "742 Evergreen Terrace",
      "city": "Springfield",
      "state": "IL",
      "zip": "62704",
      "phone": "217-555-0142",
      "speed": "express"
    }
  }
}
```

## Gaps and future work

### Not yet in v0.9

- **Required field markers** — no `required: true` prop on TextField; validation is agent-side only
- **Field validation** — no `pattern`, `minLength`, `maxLength`, `type: "email"` constraints in the component spec
- **Conditional fields** — can't show/hide fields based on other field values (e.g., show "apt/suite" only if street looks like an apartment)
- **Error states** — no way for the agent to send back "ZIP code is invalid" and highlight the specific field
- **Field grouping / sections** — no `Fieldset` or `FormSection` component for visual grouping
- **Auto-complete / suggestions** — no typeahead or suggestion list for address fields
- **Multi-step forms** — no built-in wizard/stepper; agent would need to send sequential surfaces

### Workarounds in current spec

- **Required fields:** Agent validates after receiving data model, sends a new surface with error text if needed
- **Conditional fields:** Agent sends `updateComponents` to add/remove fields dynamically
- **Error states:** Agent can update a Text component near the field to show red error text

## Design notes

The form is intentionally "guided" — it has a friendly header, an explanatory subtitle, and pre-populated values. This feels like a conversation ("here's what I know, correct anything that's wrong") rather than a blank form dump.

The `MultipleChoice` component for delivery speed avoids free-text ambiguity — the user picks from defined options, the agent gets a clean enum value.
