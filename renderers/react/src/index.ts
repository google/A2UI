/**
 * A2UI React Renderer
 * Full A2UI Protocol Implementation
 *
 * This package provides:
 * - Protocol message processing (MessageProcessor)
 * - Transport layer (SSE)
 * - Surface rendering from adjacency-list format
 * - Data binding with JSON Pointer support
 * - Complete component catalog
 */

// =============================================================================
// SPEC-BASED RENDERING (Static JSON → React)
// =============================================================================

// Types
export type {
  PathReference,
  A2UIValue,
  A2UIAction,
  A2UIComponentSpec,
  A2UITheme,
  A2UIContextValue,
  TextSpec,
  ImageSpec,
  IconSpec,
  VideoSpec,
  AudioPlayerSpec,
  RowSpec,
  ColumnSpec,
  ListSpec,
  CardSpec,
  TabItem,
  TabsSpec,
  DividerSpec,
  ModalSpec,
  ButtonSpec,
  CheckBoxSpec,
  TextFieldSpec,
  DateTimeInputSpec,
  ChoiceOption,
  ChoicePickerSpec,
  SliderSpec,
} from './types';

// Context & Theming
export {
  A2UIProvider,
  useA2UI,
  useResolve,
  resolvePath,
  defaultTheme,
  lightTheme,
  darkTheme,
  themeToCSSVars,
  applyThemeSpec,
  instantiateTemplate,
} from './context';

// Renderer
export { A2UIRenderer, A2UIRoot, registerComponent, getComponent, renderChildren, renderChild } from './renderer';

// =============================================================================
// PROTOCOL-BASED RENDERING (Streaming Messages → React)
// =============================================================================

// Message Processor (Central state machine)
export {
  MessageProcessor,
  getDefaultProcessor,
  resetDefaultProcessor,
} from './processor';

export type {
  A2UIServerMessage,
  A2UIClientAction, // @deprecated - use ClientToServerMessage
  UserAction,
  ClientToServerMessage,
  ClientError,
  BeginRenderingMessage,
  SurfaceUpdateMessage,
  DataModelUpdateMessage,
  DeleteSurfaceMessage,
  ComponentDefinition,
  StoredComponent,
  SurfaceState,
  SurfaceStatus,
  DataEntry,
} from './processor';

export {
  isBeginRendering,
  isSurfaceUpdate,
  isDataModelUpdate,
  isDeleteSurface,
} from './processor';

// Transport Layer
export {
  SSETransport,
  JSONLStreamParser,
  parseJSONL,
} from './transport';

export type {
  SSETransportConfig,
  A2UITransport,
  TransportStatus,
  TransportEvents,
  TransportConfig,
} from './transport';

// Surface Rendering (Adjacency list → React tree)
export {
  A2UISurface,
  A2UIMultiSurface,
  useSurfaceContext,
  useSurfaceIds,
  useSurface,
  useComponent,
  useDataModel,
  useDataValue,
  useRootId,
  useSurfaceReady,
} from './surface';

// High-Level Client
export {
  A2UIClient,
  useA2UIClient,
  useConnectionStatus,
  useSendUserAction,
  useSendMessage,
  useSendAction, // @deprecated
} from './client';

// =============================================================================
// DATA BINDING
// =============================================================================

export {
  resolveValue,
  resolveDeep,
  needsResolution,
} from './binding/resolver';

export {
  getByJsonPointer,
  setByJsonPointer,
  parsePathSegments,
  isPathReference,
  isLiteralValue,
  extractLiteralValue,
} from './binding/json-pointer';

export type { BoundValue } from './binding/resolver';

// =============================================================================
// ACTIONS
// =============================================================================

export {
  normalizeAction,
  createAction,
  toUserAction,
  createUserActionMessage,
  createErrorMessage,
  fromUserAction,
  toClientAction, // @deprecated
  fromClientAction, // @deprecated
  getActionName,
  getActionContext,
  actionsEqual,
  Actions,
} from './actions';

// =============================================================================
// CATALOG REGISTRY
// =============================================================================

export {
  getCatalogRegistry,
  registerCatalogComponent,
  getComponentFromCatalog,
  STANDARD_CATALOG_V08,
  STANDARD_CATALOG_V09,
  DEFAULT_CATALOG,
} from './catalog';

export type {
  A2UIComponentFn,
  CatalogEntry,
  Catalog,
} from './catalog';

// =============================================================================
// COMPONENT REGISTRATION
// =============================================================================

// Components (self-register on import)
import './components/index';
