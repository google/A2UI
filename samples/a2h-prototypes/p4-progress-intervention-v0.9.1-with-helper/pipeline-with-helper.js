/**
 * pipeline-with-helper.js
 *
 * Generates the deploy pipeline surface using the a2h-a2ui helper library.
 * Combines createInformSurface() for the pipeline status with visible-binding
 * approval controls — all driven by updateDataModel messages.
 *
 * Compare: v0.9.0 required 9 messages (4× updateComponents to swap emoji icons
 *          and inject the approval card). v0.9.1 needs only 6 messages total:
 *          1 createSurface + 1 updateComponents + 4 updateDataModel.
 *          The approval card is in the initial tree but hidden via `visible` binding.
 */

import { createInformSurface, toJsonl } from '../lib/a2h-a2ui.js';

// --- Surface definition ---

const surfaceId = 'a2h-inform-deploy-pipeline-001';

// Step 1: Create the surface with initial components
// We use createInformSurface for the base, then manually add pipeline-specific
// components (ProgressIndicators, approval card with visible binding)

const baseSurface = createInformSurface({
  surfaceId,
  title: 'Deployment Pipeline',
  items: [
    { label: 'Application', value: '/pipeline/app' },
    { label: 'Commit',      value: '/pipeline/commit' },
    { label: 'Environment',  value: '/pipeline/environment' },
  ],
  dataModel: {},
});

// For a real implementation, the helper would support:
// - ProgressIndicator steps with data-bound mode/label
// - Visible-binding sections for conditional approval cards
// - Combined inform+authorize patterns
//
// For now, we show the hand-crafted v0.9.1 JSON (deploy-pipeline.json)
// which demonstrates the dramatic improvement over v0.9.0:
//
//   v0.9.0: 9 messages (4 updateComponents rebuilding UI per step)
//   v0.9.1: 6 messages (1 updateComponents + 4 updateDataModel)
//
// The approval card exists in the initial component tree with:
//   "visible": {"fn": "equals", "args": [{"path": "/approvalVisible"}, true]}
//
// When the pipeline reaches the deploy step, a single updateDataModel sets
// approvalVisible=true and the card appears — no tree surgery needed.

// --- Data model snapshots for each pipeline step ---

const steps = [
  {
    _comment: 'Pipeline started — Build running',
    approvalVisible: false,
    steps: {
      build:  { mode: 'indeterminate', value: 0, label: 'Build — running…' },
      test:   { mode: 'none',          value: 0, label: 'Test' },
      stage:  { mode: 'none',          value: 0, label: 'Stage' },
      deploy: { mode: 'none',          value: 0, label: 'Deploy' },
    },
  },
  {
    _comment: 'Build complete, Test running',
    approvalVisible: false,
    steps: {
      build:  { mode: 'complete',      value: 1, label: 'Build — 1m 12s' },
      test:   { mode: 'indeterminate', value: 0, label: 'Test — running…' },
      stage:  { mode: 'none',          value: 0, label: 'Stage' },
      deploy: { mode: 'none',          value: 0, label: 'Deploy' },
    },
  },
  {
    _comment: 'Test complete, Stage running',
    approvalVisible: false,
    steps: {
      build:  { mode: 'complete',      value: 1, label: 'Build — 1m 12s' },
      test:   { mode: 'complete',      value: 1, label: 'Test — 48/48 passed' },
      stage:  { mode: 'indeterminate', value: 0, label: 'Stage — running…' },
      deploy: { mode: 'none',          value: 0, label: 'Deploy' },
    },
  },
  {
    _comment: 'Stage complete, Deploy awaiting approval',
    approvalVisible: true,
    approvalSummary: 'acme-web-v2.4.1 (a3f9c21) • 48/48 tests passed • Staged OK at stage.acme.dev',
    steps: {
      build:  { mode: 'complete', value: 1, label: 'Build — 1m 12s' },
      test:   { mode: 'complete', value: 1, label: 'Test — 48/48 passed' },
      stage:  { mode: 'complete', value: 1, label: 'Stage — live at stage.acme.dev' },
      deploy: { mode: 'paused',   value: 0, label: 'Deploy — awaiting approval' },
    },
  },
];

const pipelineMeta = {
  app: 'acme-web-v2.4.1',
  branch: 'main',
  commit: 'a3f9c21',
  environment: 'production',
  startedAt: '2026-03-04T07:30:00Z',
};

// Each step is just a updateDataModel — no updateComponents needed!
const dataModelMessages = steps.map(step => ({
  version: 'v0.9.1',
  updateDataModel: {
    surfaceId,
    value: {
      pipeline: pipelineMeta,
      approvalVisible: step.approvalVisible,
      approvalSummary: step.approvalSummary || '',
      steps: step.steps,
    },
  },
}));

console.log('// Base surface (from helper):');
console.log(JSON.stringify(baseSurface, null, 2));
console.log('\n// Data model updates (one per pipeline step):');
console.log(JSON.stringify(dataModelMessages, null, 2));

// --- Comparison ---
//
// v0.9.0 (deploy-pipeline.json):
//   9 messages total:  1 createSurface + 4 updateDataModel + 4 updateComponents
//   30 components, ~200 lines, 6.5 KB
//   Every step transition requires updateComponents to swap emoji icons
//   Approval card injected via updateComponents (rebuilds children array)
//
// v0.9.1 (this file / deploy-pipeline.json):
//   6 messages total:  1 createSurface + 1 updateComponents + 4 updateDataModel
//   28 components, ~130 lines, 5.2 KB
//   Step transitions are pure data model updates (ProgressIndicator reacts to mode/value)
//   Approval card uses visible binding — appears when approvalVisible flips to true
//   ZERO updateComponents after initial setup!
//
// Key wins:
//   - 33% fewer messages (9 → 6)
//   - Eliminated ALL mid-flow updateComponents (4 → 0)
//   - ProgressIndicator replaces emoji hack (⬜⏳✅ → native spinner/checkmark)
//   - KeyValue replaces Row+Text+Text for metadata
//   - visible binding means the entire UI is declared upfront — state changes are just data
