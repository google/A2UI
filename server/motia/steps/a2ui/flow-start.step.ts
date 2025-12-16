import { NoopConfig } from 'motia'

/**
 * NOOP Step: A2UI Flow Start
 * 
 * Entry point for the A2UI protocol flow visualization in Workbench.
 * This creates a visual starting point for the workflow.
 */
export const config: NoopConfig = {
  type: 'noop',
  name: 'A2UIFlowStart',
  description: 'A2UI Protocol - Entry point for dynamic UI generation',
  virtualEmits: ['a2ui.client.connected'],
  virtualSubscribes: [],
  flows: ['a2ui-protocol'],
}

// NOOP steps don't need handlers - they're purely for Workbench workflow visualization

