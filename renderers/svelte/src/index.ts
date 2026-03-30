// Core binding layer
export { createA2UI, type A2UIOptions, type A2UIInstance } from './core/use-a2ui.svelte.js';
export {
  createComponentBinding,
  dispatchAction,
  getNormalizedPath,
} from './core/use-component.svelte.js';
export { fromSignal, disposeSignal } from './core/signal-bridge.svelte.js';
export type {
  BoundProperty,
  A2UIComponentProps,
  ComponentRegistry,
  DisposableSignal,
} from './core/types.js';

// Components
export { default as ComponentHost } from './core/ComponentHost.svelte';
export { default as Surface } from './Surface.svelte';

// Re-export key web_core types for convenience
export type {
  ComponentApi,
  Catalog,
  FunctionImplementation,
  SurfaceModel,
  SurfaceGroupModel,
  DataContext,
  ComponentContext,
} from '@a2ui/web_core/v0_9';
