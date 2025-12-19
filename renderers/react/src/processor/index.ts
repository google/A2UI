/**
 * A2UI Message Processor Module
 */

export {
  MessageProcessor,
  getDefaultProcessor,
  resetDefaultProcessor,
} from './MessageProcessor';

export type {
  A2UIServerMessage,
  A2UIClientAction,
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
} from './types';

export {
  isBeginRendering,
  isSurfaceUpdate,
  isDataModelUpdate,
  isDeleteSurface,
} from './types';
