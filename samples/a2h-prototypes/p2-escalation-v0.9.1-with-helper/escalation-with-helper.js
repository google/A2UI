/**
 * escalation-with-helper.js
 *
 * Demonstrates generating the same escalation surface using the a2h-a2ui helper library.
 * Compare: ~40 lines of helper code vs ~140 lines of hand-written JSON (v0.9.0)
 *          or ~110 lines of v0.9.1 JSON.
 */

import { createEscalateSurface, toJsonl } from '../lib/a2h-a2ui.js';

// --- The entire surface definition in ~30 lines ---

const messages = createEscalateSurface({
  surfaceId: 'a2h-escalate-001',
  reason: "I wasn't able to resolve your billing dispute. The charge of $89.99 on Feb 28 requires manual review by our billing team. I'm connecting you with a specialist who can help.",
  context: "Checked transaction history, verified charge details, attempted automated refund (declined — requires manual review)",
  options: [
    { id: 'chat-btn',     label: '💬 Connect via Chat',      event: 'a2h.escalate.connect' },
    { id: 'callback-btn', label: '📞 Request Callback',      event: 'a2h.escalate.connect' },
    { id: 'schedule-btn', label: '📅 Schedule Appointment',   event: 'a2h.escalate.connect' },
  ],
  dataModel: {
    escalation: {
      reason: "I wasn't able to resolve your billing dispute. The charge of $89.99 on Feb 28 requires manual review by our billing team. I'm connecting you with a specialist who can help.",
      attemptedActions: "Checked transaction history, verified charge details, attempted automated refund (declined — requires manual review)",
      issueCategory: "Billing Dispute — Unauthorized Charge",
      conversationDuration: "8 minutes (12 messages)",
      priority: "high",
      priorityLabel: "⚡ High Priority — Billing dispute, potential unauthorized charge",
      statusMessage: "Estimated wait: ~2 minutes for chat, ~15 minutes for callback",
      conversationContext: [
        { role: "user", summary: "Reported unexpected $89.99 charge from 'DGTL-SVC' on Feb 28" },
        { role: "agent", summary: "Identified charge, attempted automated dispute — system requires human review" },
        { role: "user", summary: "Confirmed they did not authorize the charge" },
      ],
    },
    meta: {
      interactionId: "esc-2026-0304-042",
      agentId: "customer-support-v3",
      agentName: "Support Assistant (AI)",
      intent: "ESCALATE",
      timestamp: "2026-03-04T06:48:00Z",
      department: "billing",
      queuePosition: 3,
    },
  },
});

// Output as JSON array
console.log(JSON.stringify(messages, null, 2));

// --- Comparison ---
//
// v0.9.0 hand-written JSON:  ~140 lines, 36 components, 5.8 KB
// v0.9.1 hand-written JSON:  ~110 lines, 28 components, 4.5 KB
// Helper library call:        ~45 lines (including data model), generates equivalent output
//
// The helper:
//   - Generates correct component IDs automatically
//   - Wires up the Card → Column → [header, divider, body, divider, actions] skeleton
//   - Creates the reason text, context card, and status binding
//   - Sets up connection option buttons with event names
//   - Returns the standard 3-message sequence (createSurface, updateDataModel, updateComponents)
//
// Note: The helper generates v0.9.0-compatible output (Text children for buttons,
// Row+Text+Text for context details). The v0.9.1 hand-written version uses KeyValue
// and Button.label for cleaner output. The helper abstracts this — users don't care.
