/**
 * A2UI Protocol Message Types
 * Based on A2UI Specification v0.8 / v0.9
 */

// =============================================================================
// COMPONENT DEFINITION (Adjacency List Format)
// =============================================================================

/**
 * Component payload as stored in adjacency list
 * The `component` wrapper contains the component type and properties
 */
export interface ComponentDefinition {
  id: string;
  component: {
    [componentType: string]: Record<string, unknown>;
  };
}

/**
 * Flattened component for internal storage
 */
export interface StoredComponent {
  id: string;
  type: string;
  props: Record<string, unknown>;
}

// =============================================================================
// DATA MODEL ENTRIES
// =============================================================================

/**
 * Data model entry (v0.8 typed format)
 */
export interface DataEntry {
  key: string;
  valueString?: string;
  valueNumber?: number;
  valueBoolean?: boolean;
  valueMap?: DataEntry[];
}

// =============================================================================
// SERVER → CLIENT MESSAGES
// =============================================================================

/**
 * beginRendering - Signals surface is ready to render
 * v0.9 calls this "createSurface"
 */
export interface BeginRenderingMessage {
  type: 'beginRendering';
  surfaceId: string;
  root: string;
  catalogId?: string;
  styles?: Record<string, unknown>;
}

/**
 * surfaceUpdate - Add or update components
 */
export interface SurfaceUpdateMessage {
  type: 'surfaceUpdate';
  surfaceId: string;
  components: ComponentDefinition[];
}

/**
 * dataModelUpdate - Update the data model
 */
export interface DataModelUpdateMessage {
  type: 'dataModelUpdate';
  surfaceId: string;
  contents: DataEntry[];
  path?: string;
}

/**
 * deleteSurface - Remove a surface
 */
export interface DeleteSurfaceMessage {
  type: 'deleteSurface';
  surfaceId: string;
}

/**
 * Union of all server → client message types
 */
export type A2UIServerMessage =
  | BeginRenderingMessage
  | SurfaceUpdateMessage
  | DataModelUpdateMessage
  | DeleteSurfaceMessage;

// =============================================================================
// CLIENT → SERVER MESSAGES (Actions)
// =============================================================================

/**
 * User action sent from client to server (A2UI spec format)
 * This is the wire format per client_to_server.json schema
 */
export interface UserAction {
  /** The name of the action, taken from the component's action.name property */
  name: string;
  /** The id of the surface where the event originated */
  surfaceId: string;
  /** The id of the component that triggered the event */
  sourceComponentId: string;
  /** An ISO 8601 timestamp of when the event occurred */
  timestamp: string;
  /** A JSON object containing the key-value pairs from action.context, after resolving data bindings */
  context: Record<string, unknown>;
}

/**
 * Client-to-server message wrapper (A2UI spec format)
 * Exactly ONE of the properties must be set
 */
export interface ClientToServerMessage {
  userAction?: UserAction;
  error?: ClientError;
}

/**
 * Client error message
 */
export interface ClientError {
  [key: string]: unknown;
}

/**
 * @deprecated Use UserAction instead - kept for backwards compatibility
 */
export interface A2UIClientAction {
  surfaceId: string;
  componentId?: string;
  action: {
    name: string;
    context?: Record<string, unknown>;
  };
}

// =============================================================================
// SURFACE STATE
// =============================================================================

export type SurfaceStatus = 'buffering' | 'ready' | 'deleted';

/**
 * State of a single surface
 */
export interface SurfaceState {
  surfaceId: string;
  status: SurfaceStatus;
  rootId: string | null;
  catalogId: string;
  styles: Record<string, unknown>;
  components: Map<string, StoredComponent>;
  dataModel: Map<string, unknown>;
  /** Buffered messages received before beginRendering */
  buffer: {
    surfaceUpdates: SurfaceUpdateMessage[];
    dataModelUpdates: DataModelUpdateMessage[];
  };
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

export function isBeginRendering(msg: A2UIServerMessage): msg is BeginRenderingMessage {
  return msg.type === 'beginRendering';
}

export function isSurfaceUpdate(msg: A2UIServerMessage): msg is SurfaceUpdateMessage {
  return msg.type === 'surfaceUpdate';
}

export function isDataModelUpdate(msg: A2UIServerMessage): msg is DataModelUpdateMessage {
  return msg.type === 'dataModelUpdate';
}

export function isDeleteSurface(msg: A2UIServerMessage): msg is DeleteSurfaceMessage {
  return msg.type === 'deleteSurface';
}
