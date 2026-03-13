# A2H × A2UI: Rendering Human-in-the-Loop Interactions

**Version:** 1.0 — March 2026  
**Authors:** Alan Blount, Zaf  
**Status:** Proposal

---

## Executive Summary

**A2H** (Agent-to-Human) is Twilio's open protocol for standardized, auditable communication between AI agents and human principals. It defines five intent types — INFORM, COLLECT, AUTHORIZE, ESCALATE, RESULT — covering every reason an agent contacts a human, with cryptographic evidence of consent. **A2UI** v0.9 is a protocol for rendering server-driven UI from agent output, with data-bound components, streaming updates, and multi-renderer support (Lit, Angular, Flutter).

These protocols are complementary. A2H defines *what* agents need from humans and *why*. A2UI defines *how it looks*. Neither addresses the other's concern. Today, A2H's `channel.render` field offers only flat text (`title` + `body`), which is adequate for SMS but impoverished for web/app channels. A2UI has the component vocabulary to render rich, interactive A2H intents — forms, approval cards, progress indicators — but lacks conventions for doing so.

We propose a three-layer approach: (1) **convention patterns** that work with A2UI v0.9 today, (2) a **helper library** (`a2h-a2ui`) that eliminates boilerplate, and (3) **four targeted A2UI spec enhancements** that resolve the remaining friction. Five working prototypes validate the mapping and expose the gaps.

---

## Background

### A2H: The Five Intents

| Intent | Direction | Blocking | Purpose |
|--------|-----------|----------|---------|
| **INFORM** | Agent → Human | No | One-way notification |
| **COLLECT** | Agent ↔ Human | Yes | Gather structured data |
| **AUTHORIZE** | Agent ↔ Human | Yes | Request approval with auth evidence |
| **ESCALATE** | Agent → Human | Yes | Hand off to human support |
| **RESULT** | Agent → Human | No | Report task completion |

A2H's differentiator is its **trust layer**: every AUTHORIZE interaction produces JWS-signed evidence linking intent → consent → action. Intents use DIDs for identity, TTLs for expiry, and configurable assurance levels (passkey, OTP, push). The protocol is channel-agnostic — the A2H gateway routes to SMS, email, push, or web.

### A2UI v0.9: What's Relevant

A2UI's basic catalog provides: `Text`, `Image`, `Icon`, `Card`, `Row`, `Column`, `List`, `Tabs`, `Divider`, `Button`, `TextField`, `CheckBox`, `ChoicePicker`, `DateTimeInput`, `Slider`, `Modal`. Key features for A2H:

- **Data binding** — `{"path": "/foo"}` provides two-way binding between components and a JSON data model
- **`sendDataModel: true`** — on `createSurface`, ensures the full data model accompanies every action event
- **`updateComponents` merge** — send only changed components; the renderer merges into the existing tree
- **`updateDataModel`** — push new data from the server; bound components update automatically
- **Validation** — `required()`, `regex()`, `email()`, `length()` functions on Checkable components
- **Formatting** — `formatCurrency()`, `formatDate()`, `formatNumber()` for display

### The Gap

A2H defines a message envelope with `channel.render.title` and `channel.render.body` — plain text. For SMS, this is fine. For a web or app experience, you want a form with validation for COLLECT, a detail card with approve/reject buttons for AUTHORIZE, a live-updating status indicator for ESCALATE. A2UI has these components but no guidance on how to compose them for A2H intents. That's what this document provides.

---

## Intent-to-Surface Mapping

| A2H Intent | A2UI Surface Pattern | Key Components | `sendDataModel` | Coverage |
|------------|---------------------|----------------|------------------|----------|
| **INFORM** | Notification card | Card → Column → Icon + Text | No | ✅ Complete |
| **COLLECT** | Form card | Card → Column → TextFields + ChoicePicker + Button | **Yes** | ✅ Complete |
| **AUTHORIZE** | Confirmation card | Card → Column → detail rows + Approve/Reject Buttons | **Yes** | ⚠️ 90% (no conditional visibility, no TTL countdown) |
| **ESCALATE** | Status card with live updates | Card → Column → Text (bound) + Button (cancel) | Yes | ⚠️ 80% (no progress indicator) |
| **RESULT** | Completion card | Card → Column → Icon (✓/✗) + Text + optional link Button | No | ✅ Complete |

Every intent maps to the same three-message pattern:
```
createSurface  →  updateDataModel  →  updateComponents
```

Surface IDs follow: `a2h-{intent}-{interactionId}`  
Event names follow: `a2h.{intent}.{action}` (e.g., `a2h.authorize.approve`)

---

## What Works Today

### `sendDataModel: true` is the Key Enabler

This single flag on `createSurface` eliminates the need to wire individual form field values into button action contexts. When any event fires, the renderer includes the entire data model snapshot. For COLLECT, this means the agent gets all form values on submit. For AUTHORIZE, it means the interaction ID and all metadata travel with the approval. This is the most important pattern in the entire integration.

Prototypes P1, P3, and P5 all rely on this. It works cleanly. A React developer would recognize it as analogous to uncontrolled forms with `FormData` — simple and correct.

### Data Binding + Formatting

`{"path": "/transfer/amount"}` in a Text component, combined with `formatCurrency()`, renders `$500.00` from a numeric value in the data model. P1 uses this for the approval card's financial details. P2 uses it for live escalation status messages that update via `updateDataModel`. The binding is two-way for input components, one-way for display components. It just works.

### Incremental Updates via `updateComponents`

P4 (deploy pipeline) sends four sequential `updateComponents` messages, each changing only the components that differ. The renderer merges them. This produces a convincing real-time progress experience — build ✅, test ✅, stage ✅, then an approval gate appears. The merge model is better than full re-renders for server-driven UI over a network.

### Card-Based Layout

Every prototype uses the same structural pattern: `Card → Column → [header Row, Divider, body content, Divider, action Row]`. It handles every A2H intent we tested. It's not exciting, but it's reliable and consistent across renderers.

---

## Proposed A2UI Enhancements

Ranked by impact. Based on findings across all five prototypes.

### 1. Conditional Visibility (`visible` binding)

**What it enables:** Show/hide components based on data model state. Every prototype works around this gap. P4 restructures `children` arrays to inject an approval card. P5 replaces entire component trees per step. P1 can't disable buttons after the user clicks Approve — it must swap the whole tree.

**Proposed:** Add `visible` property to `ComponentCommon`, accepting a `DynamicBoolean`:

```json
{
  "id": "btn-approve",
  "component": "Button",
  "visible": {"fn": "equals", "args": [{"path": "/state"}, "pending"]},
  "child": "btn-approve-text",
  "action": { "event": { "name": "a2h.authorize.approve" } }
}
```

**Without this**, every state transition requires a full `updateComponents` message containing the entire replacement tree. This is verbose, error-prone (stale IDs), and prevents smooth transitions.

**Complexity:** Small — additive schema change to ComponentCommon. No new components. Renderers add a conditional check before rendering.

### 2. Button `label` Prop

**What it enables:** Eliminate the mandatory Text-child-per-button boilerplate. Every prototype pays this tax — two components and two IDs per button. P5 has 6 buttons = 12 extra components.

**Proposed:**

```json
{
  "id": "btn-approve",
  "component": "Button",
  "label": "Approve",
  "variant": "primary",
  "action": { "event": { "name": "a2h.authorize.approve" } }
}
```

**Impact:** ~15-20% reduction in component count across all prototypes. This is the single biggest boilerplate source.

**Complexity:** Tiny. Add an optional `label` string prop; if present, renderer creates an implicit Text child.

### 3. ProgressIndicator Component

**What it enables:** Loading/progress states for ESCALATE ("connecting to support...") and AUTHORIZE TTL countdowns. Three prototypes independently fake this with emoji (⏳, ⬜, ✅) or plain text ("Step 2 of 4").

**Proposed:**

```json
{
  "id": "connecting-spinner",
  "component": "ProgressIndicator",
  "mode": "indeterminate",
  "label": {"path": "/statusMessage"}
}
```

Also support `mode: "determinate"` with a `value` (0.0–1.0) for pipeline progress.

**Complexity:** Small. Single new component. Every UI framework has a spinner/progress widget.

### 4. KeyValue Component

**What it enables:** Eliminate the 3-component-per-row pattern for label-value pairs (Row → Text label → Text value). P1's approval details, P2's context card, P5's review step all use this pattern. P5's review step alone has 7 pairs = 21 components.

**Proposed:**

```json
{
  "id": "detail-amount",
  "component": "KeyValue",
  "label": "Amount",
  "value": {"fn": "formatCurrency", "args": [{"path": "/amount"}, "USD"]}
}
```

**Impact:** ~60-70% reduction in summary/detail-view components.

**Complexity:** Small. Renders as a styled row with label and value. Every design system has this.

---

## Convention Patterns

These require no spec changes — just documented best practices.

### Surface ID Convention

```
a2h-{intentType}-{interactionId}
```

Example: `a2h-authorize-01936f8a-7b2c-7000-8000-000000000001`

### Component ID Convention

```
root                          # root container
header, body, footer          # structural sections  
title, subtitle, description  # text elements
actions                       # button row
btn-{action}                  # btn-approve, btn-reject, btn-submit
field-{name}                  # field-email, field-address
detail-{key}                  # detail-amount, detail-agent
```

### Event Name Convention

```
a2h.{intent}.{action}
```

Examples: `a2h.authorize.approve`, `a2h.collect.submit`, `a2h.escalate.cancel`

### Data Model Path Convention

```
/state                        # "pending" | "approved" | "rejected" | "expired"
/interactionId                # A2H interaction_id
/agentId                      # A2H agent_id  
/fields/{name}                # COLLECT form values
/meta/{key}                   # TTL, assurance level, timestamps
```

### State Transition Pattern (v0.9 workaround)

Without conditional visibility, state changes require replacing the component tree:

1. User clicks Approve → event fires with `a2h.authorize.approve`
2. Server sends `updateDataModel` setting `/state` to `"approved"`
3. Server sends `updateComponents` replacing action buttons with a confirmation Text + Icon
4. Optionally, server sends `deleteSurface` after a delay

This works but is verbose. The `visible` binding (Enhancement #1) would reduce step 3 to a data model update only.

### Card Layout Template

Every A2H intent follows this skeleton:

```
Card
  └─ Column
       ├─ Row [icon + title]         ← header
       ├─ Divider
       ├─ [intent-specific content]  ← body  
       ├─ Divider
       └─ Row [buttons]              ← actions
```

---

## Helper Library: `a2h-a2ui`

### Motivation

Rendering an AUTHORIZE intent as A2UI requires ~40 lines of component JSON, correct data model setup, proper ID wiring, and event naming. This is mechanical and error-prone. A helper library reduces each intent to a single function call.

### API Design

```typescript
import { createAuthorizeSurface, createCollectForm, createInformCard } from 'a2h-a2ui';

// AUTHORIZE → A2UI messages
const messages = createAuthorizeSurface({
  interactionId: '01936f8a-...',
  action: 'book_flight',
  description: 'Book SFO→JFK on Mar 15',
  amount: 450,
  currency: 'USD',
  agentId: 'did:web:travel-agent.example.com',
  ttlSec: 300,
});
// Returns: [createSurface, updateDataModel, updateComponents] messages

// COLLECT → A2UI messages  
const messages = createCollectForm({
  interactionId: '...',
  title: 'Shipping Address',
  fields: [
    { name: 'name', type: 'text', label: 'Full Name', required: true },
    { name: 'street', type: 'text', label: 'Street Address', required: true },
    { name: 'state', type: 'choice', label: 'State', options: ['CA', 'NY', ...] },
    { name: 'zip', type: 'text', label: 'ZIP Code', pattern: '^\\d{5}$' },
  ],
});

// Parse action events back to A2H responses
const response = parseActionEvent(event);
// { intent: 'authorize', action: 'approve', interactionId: '...', dataModel: {...} }
```

### Utilities

```typescript
// Surface/component ID generation
makeSurfaceId('authorize', interactionId)  // → "a2h-authorize-01936f8a-..."
makeFieldId('email')                        // → "field-email"

// JSONL serialization
toJsonlStream(messages)                     // → string of newline-delimited JSON
fromJsonlStream(jsonl)                      // → message array

// TTL management (since A2UI has no native TTL)
const { messages, deleteAt } = withTtl(surfaceMessages, 300);
// Caller is responsible for scheduling deleteSurface at deleteAt
```

### Target

npm package, TypeScript, zero dependencies. Works with any A2UI renderer. Generates spec-compliant A2UI v0.9 JSONL. Approximately 500-800 lines of code.

---

## Prototypes

Five prototypes validate the intent-to-surface mapping. Each is a standalone HTML file with a vanilla JS renderer plus the A2UI message sequence as JSON.

> **Note:** All v0.9.0 prototypes underwent critical developer and user review. Common bugs found across multiple prototypes:
> - `variant: "label"` on Text — not a valid v0.9 variant (fixed to `"caption"`)
> - `MultipleChoice` component — doesn't exist in basic catalog (fixed to `ChoicePicker`)
> - `_comment` fields — invalid per `additionalProperties: false` (removed)
> - Invalid icon names — some icons not in the catalog enum (fixed to valid alternatives)
>
> These recurring errors are instructive: they reveal what LLMs and developers *expect* from the spec. See [Lessons for the Spec Team](#lessons-for-the-spec-team) below.

### P1: Approval Card (AUTHORIZE) — [p1-approval-v0.9.0/](./p1-approval-v0.9.0/)

A financial transfer approval card. Shows transfer details (account, amount formatted with `formatCurrency`, description) in a detail section, with Approve and Reject buttons. Demonstrates the core AUTHORIZE lifecycle and `sendDataModel: true` pattern.

**What users see:** A card titled "Authorization Required" with a lock icon. Transfer details in a nested detail section. Two buttons at the bottom: blue "Approve" and grey "Reject". After clicking, the server would replace buttons with a confirmation message (not yet implemented in the static prototype).

**Rating: 4/5.** Clean and production-ready pattern. Missing post-approval state transition and dismiss option.

### P2: Escalation Handoff (ESCALATE) — [p2-escalation-v0.9.0/](./p2-escalation-v0.9.0/)

A customer service escalation card. Shows the escalation reason, conversation context preserved in a nested card, priority indicator, and three connection method buttons (chat, phone, video). Status message updates via `updateDataModel`.

**What users see:** A card with a person icon and "Connecting to Support" title. Priority badge in red. Previous context summary. Three action buttons offering different connection methods. Status text that updates in real-time.

**Rating: 4/5.** Good use of live data model updates. The context preservation pattern (nested card with prior conversation) is well-designed.

### P3: Guided Input Form (COLLECT) — [p3-guided-input-v0.9.0/](./p3-guided-input-v0.9.0/)

A shipping address form with TextFields, a ChoicePicker for delivery speed, and pre-populated values. The star prototype — cleanest mapping, most LLM-friendly component tree.

**What users see:** A form titled "Shipping Details" with fields for name, street, city (side-by-side with state dropdown), ZIP code, and delivery speed selection. A blue "Submit" button at the bottom. Fields show pre-populated values that the user can edit.

**Rating: 5/5.** This is exactly what COLLECT should look like. Simple, clean, immediately understandable. The `sendDataModel` pattern shines here.

### P4: Deploy Pipeline (INFORM → AUTHORIZE) — [p4-progress-intervention-v0.9.0/](./p4-progress-intervention-v0.9.0/)

A deployment pipeline that progressively updates: Build ✅ → Test ✅ → Stage ✅ → Approval Gate ⏸️. Demonstrates INFORM-to-AUTHORIZE transition and dynamic tree modification (injecting an approval card at step 4).

**What users see:** A pipeline visualization with four steps. Each step animates from pending (⬜) to running (⏳) to complete (✅). At step 4, an approval card slides in with "Deploy to Production?" and Approve/Rollback buttons.

**Rating: 4/5.** Most technically interesting prototype — progressive updates and tree mutation are compelling. JSON structure was validated and fixed during critical review (proper `version` fields, separate messages, no `_comment` fields). Emoji-as-icons is fragile across platforms; the v0.9.1 version replaces them with ProgressIndicator.

### P5: Expense Report Wizard (COLLECT → COLLECT → INFORM → AUTHORIZE) — [p5-wizard-v0.9.0/](./p5-wizard-v0.9.0/)

A four-step wizard on a single persistent surface. Step 1 collects expense basics, step 2 collects receipt details, step 3 shows a read-only review, step 4 requests final approval. Each step is a full `updateComponents` that swaps the visible content.

**What users see:** A step indicator ("Step 1 of 4") with a title that changes per step. Form fields in steps 1-2, a summary table in step 3, and an approval card with a policy warning in step 4. Back/Next navigation.

**Rating: 4/5.** Ambitious and realistic multi-intent flow. Exposes every gap simultaneously — the review step's 21-component summary table desperately needs KeyValue, step navigation relies on fragile ID reuse, and the lack of conditional visibility makes the step-swap pattern verbose. Critical review fixed `MultipleChoice`→`ChoicePicker`, `variant: "label"`→`"caption"`, and `_comment` fields. The v0.9.1 version is the most dramatic improvement of all five prototypes.

---

## Gaps & Future Work

### Addressable via Convention (no spec changes)

- Event naming, surface IDs, data model paths — documented above
- State transitions via `updateComponents` tree swap
- Wizard/stepper patterns via sequential `updateComponents`
- Form-level validation gating via `and()` composition over Checkable fields

### Addressable via Helper Library

- Boilerplate reduction (~40 lines → 1 function call per intent)
- Component ID generation and collision avoidance
- JSONL serialization/deserialization
- TTL scheduling (client-side `setTimeout` for `deleteSurface`)

### Requires A2UI Spec Changes

| Enhancement | Impact | Effort |
|-------------|--------|--------|
| `visible` binding | Eliminates tree-swap workaround for all state transitions | Small |
| Button `label` prop | 15-20% component reduction | Tiny |
| ProgressIndicator | Proper loading/progress states | Small |
| KeyValue | 60-70% reduction in detail views | Small |

### Explicitly Out of Scope (for now)

**Cryptographic evidence in A2UI actions.** A2H's killer feature is JWS-signed consent evidence. A2UI buttons fire plain events with no mechanism for client-side auth flows (WebAuthn, passkeys). This is important but it's a massive scope expansion — it requires client-side auth integration, which is properly an A2H gateway concern, not a rendering concern. The right architecture: A2UI renders the approval card, the button fires an event, the A2H gateway intercepts and triggers the auth flow before forwarding to the agent.

**Multi-surface orchestration.** P5's wizard uses a single surface with tree swaps. An alternative is multiple surfaces (one per step) with an orchestrator. A2UI has no concept of surface relationships or sequencing. This matters for complex workflows but can be handled in the helper library or application layer.

**`updateDataModel` partial updates.** Currently replaces the entire model. JSON Patch or merge semantics would help for large data models. Low priority — A2H data models are typically small.

---

## Before & After: v0.9.0 vs v0.9.1

We rebuilt all five prototypes using the proposed v0.9.1 features (`visible` binding, Button `label`, `ProgressIndicator`, `KeyValue`). Here's what changed — measured from the actual JSON files.

### Summary Table

| Prototype | v0.9.0 Msgs | v0.9.1 Msgs | v0.9.0 Components | v0.9.1 Components | v0.9.0 JSON Lines | v0.9.1 JSON Lines | Reduction |
|-----------|:-----------:|:-----------:|:------------------:|:------------------:|:------------------:|:------------------:|:---------:|
| P1 Approval | 3 | 3 | 28 | 21 | 223 | 192 | 14% lines, 25% components |
| P2 Escalation | 3 | 3 | 36 | 28 | 290 | 253 | 13% lines, 22% components |
| P3 Guided Input | 3 | 3 | 21 | 48 | 168 | 354 | +110%¹ (4 states vs 1) |
| P4 Pipeline | 9 | 6 | 45 | 32 | 180 | 162 | 10% lines, 29% components, 33% msgs |
| P5 Wizard | 6 | 3 | 82 | 59 | 210 | 141 | 33% lines, 28% components, 50% msgs |

¹ P3 v0.9.1 is intentionally larger — it defines 4 complete UI states (edit → review → processing → success) in a single component tree, where v0.9.0 only defines the editing state. Per-state, v0.9.1 is more efficient.

### Per-Prototype Breakdown

#### P1: Approval Card (AUTHORIZE)

**Demonstrates:** Financial transfer approval with detail display and approve/reject buttons.

**v0.9.1 features used:** KeyValue (4 detail rows → 4 components instead of 12), Button `label` (2 buttons lose their Text children), `visible` binding (post-approval state change is a data model update, not a tree swap), ProgressIndicator (processing spinner).

**Key improvement:** Post-action state transitions go from "send a full `updateComponents` replacing the button row" to "send `updateDataModel` with `state: processing`". The entire post-approval flow is zero component tree surgery.

**Remaining gaps:** No TTL countdown timer. No mechanism for cryptographic evidence (passkey/OTP) — properly an A2H gateway concern.

#### P2: Escalation Handoff (ESCALATE)

**Demonstrates:** Customer service handoff with context preservation and multiple connection options.

**v0.9.1 features used:** KeyValue (4 context rows), Button `label` (3 buttons), `visible` binding (connecting state), ProgressIndicator (connecting spinner).

**Key improvement:** Same pattern as P1 — the "Connecting you to an agent..." state transition is a single data model update. The 3 connection buttons hide and the spinner appears without touching the component tree.

**Remaining gaps:** No real-time queue position or ETA. Would benefit from a `Timer` or `Countdown` component for wait time estimates.

#### P3: Guided Input Form (COLLECT)

**Demonstrates:** Shipping address form with validation, pre-populated values, and a review-before-submit flow.

**v0.9.1 features used:** `visible` binding (4 mutually exclusive states: edit → review → processing → success), KeyValue (7 review summary rows), Button `label` (4 buttons), ProgressIndicator (submit spinner).

**Key improvement:** The review-before-submit pattern is impossible in v0.9.0 without server round-trips. v0.9.1 declares all 4 states upfront; transitions are purely client-side via data model. The review step alone saves 14 components (7 × KeyValue vs 7 × Row+Text+Text).

**Remaining gaps:** The v0.9.1 file is larger overall because it declares all states upfront. This is the correct trade-off (fewer round-trips, declarative UI), but it means the initial payload is bigger. A `Stepper` or `Wizard` meta-component could reduce this further.

#### P4: Deploy Pipeline (INFORM → AUTHORIZE)

**Demonstrates:** Progressive deployment pipeline with real-time status updates and an approval gate.

**v0.9.1 features used:** ProgressIndicator (native step status instead of emoji ⬜⏳✅), `visible` binding (approval card hidden until deploy step), KeyValue (deployment metadata), Button `label` (approve/rollback buttons).

**Key improvement:** The most dramatic change — **zero `updateComponents` messages after initial setup**. v0.9.0 needed 4 `updateComponents` (one per step transition, plus injecting the approval card). v0.9.1 drives everything through `updateDataModel`. This is the difference between imperative and declarative UI.

**Remaining gaps:** No determinate progress bar (ProgressIndicator `mode: "determinate"` with `value` binding would be ideal). Step timing/duration isn't tracked.

#### P5: Expense Report Wizard (COLLECT → COLLECT → INFORM → AUTHORIZE)

**Demonstrates:** Multi-step wizard chaining 4 A2H intents on a single persistent surface.

**v0.9.1 features used:** `visible` binding (5 step containers + processing state), KeyValue (7 review rows in step 3, plus step 4 summary), Button `label` (6 buttons), ProgressIndicator (submit processing).

**Key improvement:** 50% fewer messages (6 → 3). All step navigation is pure data model updates — `currentStep: 2` shows step 2, hides step 1. Back navigation is instant (no message replay). The review step drops from 21 components to 7.

**Remaining gaps:** Step indicator ("Step 1 of 4") is still plain text — a dedicated `Stepper` component would add affordance. No form-level cross-step validation. The initial tree is large since all steps are declared upfront.

### Recurring Patterns

These issues appeared across multiple prototypes during development:

1. **`variant: "label"` bug.** Several prototypes tried `variant: "label"` on Text components, which isn't a valid variant in the spec (valid values: `headline`, `title`, `body`, `caption`). This suggests the variant enum may need expansion, or that KeyValue's `label` sub-rendering should handle this case.

2. **`MultipleChoice` vs `ChoicePicker` naming confusion.** Prototype authors (including LLMs generating A2UI) frequently reach for `MultipleChoice` — a component that doesn't exist. The actual component is `ChoicePicker`. This naming friction is worth a spec discussion.

3. **`visible` binding is the single biggest improvement.** It transforms every prototype. P1 and P2 get cleaner state transitions. P3 gets a review-before-submit flow that's impossible in v0.9.0. P4 eliminates all mid-flow `updateComponents`. P5 cuts messages in half. If only one enhancement ships, it should be this one.

4. **Button `label` is the biggest DX win per effort.** It's a tiny spec change (one optional string prop) that eliminates 2 components and 2 IDs per button across every single prototype. The cumulative reduction is significant: P5 alone saves 6 components. It also makes LLM-generated A2UI more reliable — fewer IDs to manage means fewer wiring mistakes.

### Lessons for the Spec Team

Based on building 10 prototypes (5 × 2 versions) with real JSON:

1. **Ship `visible` binding first.** It's the only enhancement that changes the architectural model (imperative → declarative). Everything else is a convenience; this is a capability. Without it, every state transition requires a server round-trip and a full component tree replacement. With it, agents can declare complete interaction flows upfront and drive them through data alone.

2. **Button `label` is free money.** Tiny spec change, universal impact, zero controversy. Every prototype benefits. Every LLM generating A2UI benefits more. Ship it alongside `visible`.

3. **KeyValue matters most for review/summary UIs.** It's a 3:1 component reduction for detail displays. The prototypes that benefit most are P1 (approval details), P3 (review summary), and P5 (review step). If you have detail-heavy UIs, this is high-value.

4. **ProgressIndicator fills a real gap, but it's lower priority.** Every prototype that fakes loading state with emoji (⏳) or text ("Processing...") would benefit. But the workarounds are tolerable. Ship it third.

5. **Consider the initial payload trade-off.** The `visible` binding pattern front-loads complexity — all states are declared in the initial tree. P3 goes from 168 to 354 JSON lines. This is the right trade-off (fewer round-trips, declarative), but the spec should document this pattern explicitly so developers don't think bigger JSON = worse.

6. **Naming matters.** `ChoicePicker` vs `MultipleChoice` confusion is real. The spec should consider aliasing or at minimum a prominent note. Similarly, Text `variant` values need documentation or expansion — `"label"` is what people reach for instinctively.

---

## Recommendation

### Phase 1: Conventions (now)

Document and publish the convention patterns from this document: surface ID format, event naming, component ID conventions, card layout template, state transition pattern. These work with A2UI v0.9 as-is. Cost: documentation only.

### Phase 2: Helper Library (weeks)

Build `a2h-a2ui` as an npm package. TypeScript, zero dependencies, ~500-800 lines. Covers all five intents. Reduces the barrier from "read the A2UI spec and hand-craft 40 lines of JSON" to "call one function." This is what makes A2H+A2UI viable for real adoption.

### Phase 3: Spec Proposals (months)

Propose the four enhancements to the A2UI team. `visible` binding first — it's the highest-impact, lowest-effort change. Button `label` second. ProgressIndicator and KeyValue can follow.

### What to Build Independently vs. Propose

| Build ourselves | Propose to A2UI |
|----------------|-----------------|
| Convention patterns | `visible` binding |
| Helper library | Button `label` prop |
| Prototype fixes (P4 conformance) | ProgressIndicator component |
| TTL scheduling logic | KeyValue component |
| A2H gateway ↔ A2UI translator | (Future) Partial data model updates |

### Bottom Line

A2UI v0.9 handles ~80% of A2H rendering today. The `sendDataModel` pattern and data binding make COLLECT and AUTHORIZE surprisingly clean. The remaining 20% splits between one critical gap (conditional visibility), several papercuts (button boilerplate, detail-view verbosity, no progress indicator), and things properly handled outside the rendering protocol (auth evidence, TTL enforcement).

The path is clear: conventions first, library second, spec proposals third. We can ship useful A2H rendering now without waiting for spec changes.
