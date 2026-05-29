/**
 * authorize-transfer-with-helper.js
 *
 * Demonstrates generating the same approval surface using the a2h-a2ui helper library.
 * Compare: ~10 lines of helper code vs ~100+ lines of hand-written JSON (v0.9.0)
 *          or ~80 lines of v0.9.1 JSON.
 */

import { createAuthorizeSurface, toJsonl } from '../lib/a2h-a2ui.js';

// --- The entire surface definition in ~15 lines ---

const messages = createAuthorizeSurface({
  surfaceId: 'a2h-authorize-transfer-001',
  title: 'Authorization Required',
  description: 'Your financial agent wants to transfer funds between your accounts.',
  details: [
    { label: 'Action',  path: '/transfer/action' },
    { label: 'From',    path: '/transfer/fromAccount' },
    { label: 'To',      path: '/transfer/toAccount' },
    { label: 'Amount',  path: '/transfer/amount' },
  ],
  actions: [
    { id: 'reject-btn',  label: 'Reject',  variant: 'default', event: 'a2h.authorize.reject' },
    { id: 'approve-btn', label: 'Approve', variant: 'primary', event: 'a2h.authorize.approve' },
  ],
  dataModel: {
    state: 'pending',
    transfer: {
      description: 'Your financial agent wants to transfer funds between your accounts.',
      action: 'Transfer Funds',
      fromAccount: 'Checking (****4521)',
      toAccount: 'Savings (****7890)',
      amount: '$500.00',
    },
    meta: {
      interactionId: 'txn-2026-0304-001',
      agentId: 'financial-assistant-v2',
      intent: 'AUTHORIZE',
      timestamp: '2026-03-04T06:45:00Z',
      ttlSeconds: 300,
    },
  },
});

// Output as JSONL or JSON array
console.log(JSON.stringify(messages, null, 2));

// --- Comparison ---
//
// v0.9.0 hand-written JSON:  ~120 lines, 30 components, 4.2 KB
// v0.9.1 hand-written JSON:   ~90 lines, 24 components, 3.5 KB
// Helper library call:         ~35 lines (including data model), generates equivalent output
//
// The helper:
//   - Generates correct component IDs automatically
//   - Wires up the Card → Column → [header, divider, body, divider, actions] skeleton
//   - Creates detail rows with proper label+value bindings
//   - Sets up button actions with event names
//   - Returns the standard 3-message sequence (createSurface, updateDataModel, updateComponents)
//
// Note: The helper currently generates v0.9.0-compatible output (Text children for buttons,
// Row+Text+Text for details). A v0.9.1-aware version would use KeyValue and Button.label
// for even shorter output. The helper abstracts this — users don't need to know the difference.
