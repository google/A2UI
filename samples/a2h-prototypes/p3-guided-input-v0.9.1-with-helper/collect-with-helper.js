/**
 * collect-with-helper.js
 *
 * Demonstrates generating the same shipping form surface using the a2h-a2ui helper library.
 * Compare: ~15 lines of helper code vs ~140+ lines of hand-written v0.9.1 JSON.
 *
 * Note: The helper currently generates v0.9.0-compatible output (no visible binding,
 * no KeyValue, no ProgressIndicator). The v0.9.1 hand-written JSON adds:
 *   - Review-before-submit pattern via `visible` binding
 *   - KeyValue components for the review summary
 *   - ProgressIndicator for submit processing state
 *   - Button `label` prop (no Text child needed)
 *
 * A future v0.9.1-aware helper would generate these automatically.
 */

import { createCollectSurface, toJsonl } from '../lib/a2h-a2ui.js';

// --- The entire surface definition in ~25 lines ---

const messages = createCollectSurface({
  surfaceId: 'a2h-collect-shipping-001',
  title: 'Where should we ship your order?',
  fields: [
    { id: 'name',   label: 'Full name',       type: 'text', path: '/shipping/name',   value: true },
    { id: 'street', label: 'Street address',   type: 'text', path: '/shipping/street', value: true },
    { id: 'city',   label: 'City',             type: 'text', path: '/shipping/city',   value: true },
    { id: 'state',  label: 'State',            type: 'text', path: '/shipping/state',  value: true },
    { id: 'zip',    label: 'ZIP code',         type: 'text', path: '/shipping/zip',    value: true },
    { id: 'phone',  label: 'Phone number',     type: 'text', path: '/shipping/phone',  value: true },
    { id: 'speed',  label: 'Delivery speed',   type: 'select', path: '/shipping/speed',
      options: [
        { label: 'Standard (5–7 days)', value: 'standard' },
        { label: 'Express (2–3 days)',  value: 'express' },
        { label: 'Overnight',           value: 'overnight' },
      ],
      value: true,
    },
  ],
  submitLabel: 'Submit shipping info',
  dataModel: {
    shipping: {
      name: 'Jane Doe',
      street: '742 Evergreen Terrace',
      city: 'Springfield',
      state: 'IL',
      zip: '62704',
      phone: '',
      speed: ['standard'],
    },
  },
});

// Output as JSON array
console.log(JSON.stringify(messages, null, 2));

// --- Comparison ---
//
// v0.9.0 hand-written JSON:  ~90 lines, 22 components, 3.8 KB
// v0.9.1 hand-written JSON: ~140 lines, 45 components, 5.5 KB (includes review + processing + success states)
// Helper library call:       ~25 lines (including data model), generates v0.9.0-compatible output
//
// The v0.9.1 version adds significantly more functionality:
//   - "Review before submit" pattern (form hides, summary appears)
//   - Processing spinner state
//   - Success confirmation state
//   - All driven by data model state changes, no updateComponents needed
//
// The helper generates the basic form. A v0.9.1-aware helper could add
// review/processing/success sections automatically via an option like:
//   createCollectSurface({ ..., reviewBeforeSubmit: true, showProcessing: true })
