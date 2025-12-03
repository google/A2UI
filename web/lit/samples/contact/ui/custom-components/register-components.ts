import { ComponentRegistry } from '@a2ui/web-lib/ui';
import { HierarchyGraph } from './hierarchy-graph.js';
import { PremiumTextField } from './premium-text-field.js';

export function registerContactComponents() {
  const registry = ComponentRegistry.getInstance();

  // Register HierarchyGraph
  registry.register('HierarchyGraph', HierarchyGraph, 'hierarchy-graph');

  // Register PremiumTextField as an override for TextField
  registry.register('TextField', PremiumTextField, 'premium-text-field');

  console.log('Registered Contact App Custom Components');
}
