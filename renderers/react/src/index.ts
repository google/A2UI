// Re-export types from @a2ui/lit
export { Types, Primitives } from '@a2ui/lit/0.8';

// Core exports
export {
  MessageProcessor,
  A2UIProvider,
  useA2UIContext,
  useProcessor,
  useSurface,
  useDataBinding,
  useStringBinding,
  useNumberBinding,
  useBooleanBinding,
  useAction,
  useSetData,
  useA2UI,
  ThemeProvider,
  useTheme,
  type DispatchedEvent,
  type EventListener,
  type A2UIProviderProps,
  type A2UIContextValue,
  type ThemeMode,
  type ThemeProviderProps,
} from './core';

// Component exports
export {
  Surface,
  Renderer,
  ChildRenderer,
  getCatalogComponent,
  registerComponent,
  type SurfaceProps,
  type RendererProps,
  type ChildRendererProps,
  type CatalogComponent,
  type CatalogComponentProps,
} from './components';

