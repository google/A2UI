/**
 * A2UI Message Dispatcher
 *
 * Routes incoming A2UI messages to appropriate handlers and manages
 * the overall message processing flow.
 */

import type {
  A2UIMessage,
  BeginRenderingMessage,
  SurfaceUpdateMessage,
  DataModelUpdateMessage,
  DeleteSurfaceMessage,
  ErrorMessage,
} from '../types/a2ui-types';

export interface MessageHandlers {
  onBeginRendering?: (message: BeginRenderingMessage) => void;
  onSurfaceUpdate?: (message: SurfaceUpdateMessage) => void;
  onDataModelUpdate?: (message: DataModelUpdateMessage) => void;
  onDeleteSurface?: (message: DeleteSurfaceMessage) => void;
  onError?: (message: ErrorMessage) => void;
  onUnknown?: (message: A2UIMessage) => void;
}

export interface MessageDispatcherOptions {
  /** Handlers for each message type */
  handlers: MessageHandlers;

  /** Called before dispatching any message */
  onBeforeDispatch?: (message: A2UIMessage) => void;

  /** Called after dispatching any message */
  onAfterDispatch?: (message: A2UIMessage) => void;

  /** Enable debug logging */
  debug?: boolean;
}

export interface MessageDispatcher {
  /** Dispatch a single message to the appropriate handler */
  dispatch: (message: A2UIMessage) => void;

  /** Update handlers dynamically */
  setHandlers: (handlers: Partial<MessageHandlers>) => void;

  /** Get current handlers */
  getHandlers: () => MessageHandlers;
}

/**
 * Creates a message dispatcher that routes A2UI messages to handlers
 *
 * @example
 * ```typescript
 * const dispatcher = createMessageDispatcher({
 *   handlers: {
 *     onBeginRendering: (msg) => initializeSurface(msg),
 *     onSurfaceUpdate: (msg) => updateComponents(msg),
 *     onDataModelUpdate: (msg) => updateDataModel(msg),
 *   },
 *   debug: true,
 * });
 *
 * // Use with JSONL parser
 * const parser = createJSONLParser({
 *   onMessage: dispatcher.dispatch,
 * });
 * ```
 */
export function createMessageDispatcher(options: MessageDispatcherOptions): MessageDispatcher {
  let handlers = { ...options.handlers };
  const { onBeforeDispatch, onAfterDispatch, debug = false } = options;

  function log(message: string, data?: unknown): void {
    if (debug) {
      console.log(`[A2UI Dispatcher] ${message}`, data ?? '');
    }
  }

  function dispatch(message: A2UIMessage): void {
    if (onBeforeDispatch) {
      onBeforeDispatch(message);
    }

    log(`Dispatching message type: ${message.type}`, message);

    switch (message.type) {
      case 'beginRendering':
        if (handlers.onBeginRendering) {
          handlers.onBeginRendering(message as BeginRenderingMessage);
        } else {
          log('No handler for beginRendering');
        }
        break;

      case 'surfaceUpdate':
        if (handlers.onSurfaceUpdate) {
          handlers.onSurfaceUpdate(message as SurfaceUpdateMessage);
        } else {
          log('No handler for surfaceUpdate');
        }
        break;

      case 'dataModelUpdate':
        if (handlers.onDataModelUpdate) {
          handlers.onDataModelUpdate(message as DataModelUpdateMessage);
        } else {
          log('No handler for dataModelUpdate');
        }
        break;

      case 'deleteSurface':
        if (handlers.onDeleteSurface) {
          handlers.onDeleteSurface(message as DeleteSurfaceMessage);
        } else {
          log('No handler for deleteSurface');
        }
        break;

      case 'error':
        if (handlers.onError) {
          handlers.onError(message as ErrorMessage);
        } else {
          // Always log errors even in non-debug mode
          console.error('[A2UI Error]', message);
        }
        break;

      default: {
        // Use type assertion since message is exhaustively typed but
        // the API may receive unknown message types from the server
        const unknownMessage = message as { type: string };
        if (handlers.onUnknown) {
          handlers.onUnknown(unknownMessage as A2UIMessage);
        } else {
          log(`Unknown message type: ${unknownMessage.type}`);
        }
      }
    }

    if (onAfterDispatch) {
      onAfterDispatch(message);
    }
  }

  function setHandlers(newHandlers: Partial<MessageHandlers>): void {
    handlers = { ...handlers, ...newHandlers };
  }

  function getHandlers(): MessageHandlers {
    return { ...handlers };
  }

  return {
    dispatch,
    setHandlers,
    getHandlers,
  };
}

/**
 * Type guard for checking if a message is a specific type
 */
export function isBeginRenderingMessage(msg: A2UIMessage): msg is BeginRenderingMessage {
  return msg.type === 'beginRendering';
}

export function isSurfaceUpdateMessage(msg: A2UIMessage): msg is SurfaceUpdateMessage {
  return msg.type === 'surfaceUpdate';
}

export function isDataModelUpdateMessage(msg: A2UIMessage): msg is DataModelUpdateMessage {
  return msg.type === 'dataModelUpdate';
}

export function isDeleteSurfaceMessage(msg: A2UIMessage): msg is DeleteSurfaceMessage {
  return msg.type === 'deleteSurface';
}

export function isErrorMessage(msg: A2UIMessage): msg is ErrorMessage {
  return msg.type === 'error';
}
