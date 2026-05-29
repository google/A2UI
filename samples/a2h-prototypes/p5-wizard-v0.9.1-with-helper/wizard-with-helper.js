/**
 * wizard-with-helper.js
 *
 * Shows how to compose a multi-step expense wizard using the a2h-a2ui helper
 * library, combining createCollectSurface + createAuthorizeSurface into a
 * single surface with visible bindings for step transitions.
 *
 * v0.9.0 approach: 6 messages (createSurface + updateDataModel + 4× updateComponents)
 *   Every step transition = full component tree rebuild
 *   Review step = 21 components (7× Row+Text+Text)
 *   Buttons = 2 components each (Button + child Text)
 *
 * v0.9.1 approach: 3 messages (createSurface + updateComponents + updateDataModel)
 *   Step transitions = updateDataModel: { "/wizard/currentStep": N }
 *   Review step = 7 KeyValue components (replaces 21)
 *   Buttons = 1 component each (Button.label)
 *   ALL steps in initial tree with visible bindings
 *   ZERO updateComponents after initial setup!
 */

import { createCollectSurface, createAuthorizeSurface, toJsonl } from '../lib/a2h-a2ui.js';

const surfaceId = 'a2h-expense-wizard-001';

// --- Helper-based composition ---
//
// The helper library provides per-intent surface builders.
// For a wizard, we'd compose them on a single surface:

// Step 1: COLLECT — expense basics
const step1 = createCollectSurface({
  surfaceId,
  title: 'Expense Basics',
  fields: [
    { id: 'date',        label: 'Date (YYYY-MM-DD)', type: 'text', path: '/expense/date' },
    { id: 'category',    label: 'Category',           type: 'select', path: '/expense/category',
      options: ['Travel', 'Meals', 'Equipment', 'Software', 'Office Supplies', 'Other'] },
    { id: 'amount',      label: 'Amount ($)',          type: 'text', path: '/expense/amount' },
    { id: 'description', label: 'Description',         type: 'text', path: '/expense/description' },
  ],
  submitLabel: 'Next →',
  dataModel: { expense: { date: '', category: [], amount: '', description: '' } },
});

// Step 4: AUTHORIZE — final approval
const step4 = createAuthorizeSurface({
  surfaceId,
  title: 'Submit Expense Report',
  description: 'By submitting, you confirm this expense complies with company policy.',
  details: [
    { label: 'Amount',   path: '/expense/amount' },
    { label: 'Category', path: '/expense/category' },
    { label: 'Vendor',   path: '/expense/vendor' },
  ],
  actions: [
    { id: 'btn-cancel', label: 'Cancel',         variant: 'default', event: 'a2h.authorize.reject' },
    { id: 'btn-submit', label: 'Submit Expense',  variant: 'primary', event: 'a2h.authorize.approve' },
  ],
  dataModel: {},
});

console.log('// Step 1 (COLLECT) surface from helper:');
console.log(JSON.stringify(step1, null, 2));
console.log('\n// Step 4 (AUTHORIZE) surface from helper:');
console.log(JSON.stringify(step4, null, 2));

// --- The v0.9.1 approach (hand-crafted, see expense-wizard.json) ---
//
// Instead of separate surfaces per step, v0.9.1 puts ALL steps in one tree:
//
//   createSurface
//   updateComponents — ALL 4 steps + processing state in one tree
//     step1-container: visible when /wizard/currentStep === 1
//     step2-container: visible when /wizard/currentStep === 2
//     step3-container: visible when /wizard/currentStep === 3  (KeyValue review)
//     step4-container: visible when /wizard/currentStep === 4  (authorize)
//     submit-processing: visible when /wizard/currentStep === 5 (ProgressIndicator)
//   updateDataModel — initial state, currentStep: 1
//
// Navigation is JUST data model updates:
//   { "/wizard/currentStep": 2, "/wizard/stepLabel": "Step 2 of 4 — Receipt Info" }
//
// The renderer shows/hides step containers automatically.
// No updateComponents. No tree rebuilds. No component ID collisions.
//
// Future helper API could look like:
//
//   createWizardSurface({
//     surfaceId,
//     steps: [
//       { intent: 'COLLECT', title: 'Expense Basics', fields: [...] },
//       { intent: 'COLLECT', title: 'Receipt Details', fields: [...] },
//       { intent: 'INFORM',  title: 'Review', review: true },
//       { intent: 'AUTHORIZE', title: 'Submit', details: [...] },
//     ],
//     dataModel: { ... }
//   });
//
// This would generate the single-tree structure with visible bindings
// and step-label data model bindings automatically.

// --- Comparison ---
//
// v0.9.0 expense-wizard.json:
//   6 messages: createSurface + updateDataModel + 4× updateComponents
//   ~100 components total (many duplicated across steps)
//   Each step = full tree replacement, error-prone ID management
//   Review step: 21 components (7× Row + label Text + value Text)
//   Back navigation: renderer must replay messages from scratch
//
// v0.9.1 expense-wizard.json:
//   3 messages: createSurface + updateComponents + updateDataModel
//   ~70 components (no duplication, each step has unique IDs)
//   Step transitions: pure data model update (currentStep: N)
//   Review step: 7 KeyValue components (66% reduction)
//   Back navigation: just set currentStep back — instant, no replay
//   Processing state: ProgressIndicator (step 5) — native spinner
//   Buttons: label prop (no child Text components needed)
//
// Message reduction: 6 → 3 (50%)
// Component reduction: ~100 → ~70 (30%)
// updateComponents per wizard: 4 → 1 (75% reduction)
// Mid-flow updateComponents: 4 → 0 (100% elimination!)
