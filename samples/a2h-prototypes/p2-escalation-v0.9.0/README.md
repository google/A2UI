# A2H × A2UI — Prototype 2: Escalation/Handoff (ESCALATE)

## Overview

Demonstrates the **ESCALATE** intent from the A2H protocol mapped to an A2UI v0.9 surface. An AI customer service agent has exhausted its capabilities resolving a billing dispute and hands off to a human agent, preserving full conversation context.

## Files

| File | Purpose |
|------|---------|
| `escalation-handoff.json` | A2UI v0.9 message sequence (createSurface → updateComponents → updateDataModel) |
| `index.html` | Standalone vanilla JS renderer — open directly or via local server |

## Running

```bash
# From this directory
python3 -m http.server 8080
# Open http://localhost:8080
```

## A2H → A2UI Mapping

| A2H Concept | A2UI Realization |
|---|---|
| ESCALATE intent | `createSurface` with `sendDataModel: true` |
| Escalation reason | `Text` bound to `/escalation/reason` |
| Context preservation | Nested `Card` with attempted actions, issue category, duration |
| Priority indicator | `Icon` (priority_high) + `Text` with caption variant (red) |
| Connection options | Three `Button` components firing `a2h.escalate.connect` with `method` context |
| Status updates | `Text` bound to `/escalation/statusMessage` — server can push `updateDataModel` |
| Agent metadata | Stored in `/meta` — agentId, department, queuePosition |

## Event Flow

1. **AI agent** determines it cannot resolve the issue
2. **Server** sends `createSurface` + `updateComponents` + `updateDataModel`
3. **User** sees escalation card with context summary and connection options
4. **User clicks** "Connect via Chat" / "Request Callback" / "Schedule Appointment"
5. **Event fired:** `a2h.escalate.connect` with `{ method: "chat"|"callback"|"appointment" }`
6. **Server** processes and pushes `updateDataModel` to update status ("Connecting...", "Agent Sarah joined")
7. **Server** sends `deleteSurface` when handoff complete

## Data Model

```json
{
  "escalation": {
    "reason": "...",
    "attemptedActions": "...",
    "issueCategory": "...",
    "conversationDuration": "...",
    "priority": "high",
    "priorityLabel": "⚡ High Priority — ...",
    "statusMessage": "...",
    "conversationContext": [
      { "role": "user", "summary": "..." },
      { "role": "agent", "summary": "..." }
    ]
  },
  "meta": {
    "interactionId": "...",
    "agentId": "...",
    "agentName": "...",
    "intent": "ESCALATE",
    "timestamp": "...",
    "department": "...",
    "queuePosition": 3
  }
}
```

## Gaps & Missing Capabilities

| Gap | Impact | Workaround |
|-----|--------|------------|
| **No conditional rendering** | Can't show/hide components based on state (e.g., hide buttons after selection) | Server sends `updateComponents` to swap the tree |
| **No progress/spinner** | Can't show animated "connecting..." indicator | Use text + emoji (⏳) via `updateDataModel` |
| **No timer component** | Can't show live countdown for queue position | Server pushes periodic `updateDataModel` updates |
| **conversationContext array** | Stored in data model but no ChildList template to render it dynamically | Rendered as summary text instead |
| **No cancel button** | Proposal had cancel; omitted here in favor of connection options | Could add as fourth button |

## Design Decisions

- **Three connection methods** as equal-weight buttons rather than a dropdown — mobile-friendly, reduces taps
- **Context preservation** in a nested card — visually grouped, clearly "what the AI tried"
- **Single event name** (`a2h.escalate.connect`) with `method` in context — cleaner than three separate events
- **Priority as warning icon + caption text** — icon inherits red color, emoji in data model reinforces urgency
