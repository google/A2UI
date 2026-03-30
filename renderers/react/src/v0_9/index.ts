// Core
export { A2UIProvider, useA2UI, type A2UIProviderProps } from './core/A2UIProvider.js';
export { useComponentProps, dispatchAction, getNormalizedPath } from './core/useComponent.js';
export { usePreactSignal } from './core/signal-bridge.js';
export { ComponentHost } from './core/ComponentHost.js';
export { Surface } from './Surface.js';
export type { BoundProperty, A2UIComponentProps, ComponentRegistry } from './core/types.js';

// Re-export key web_core types
export type {
  ComponentApi,
  Catalog,
  FunctionImplementation,
  SurfaceModel,
  SurfaceGroupModel,
  DataContext,
  ComponentContext,
} from '@a2ui/web_core/v0_9';
