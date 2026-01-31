import { registerComponent } from '@a2ui/react';
import { OrgChart } from './OrgChart';

/**
 * Register custom components for the React sample app.
 * 
 * This demonstrates how to:
 * 1. Create new custom component types (OrgChart)
 * 2. Override existing components (if needed)
 * 
 * Call this function once at app startup before rendering.
 */
export function registerCustomComponents() {
  // Register OrgChart as a new custom component type
  registerComponent('OrgChart', OrgChart);

  console.log('Registered React Custom Components');
}

export { OrgChart };

