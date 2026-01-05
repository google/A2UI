/**
 * Message Dispatcher Tests
 */

import {
  createMessageDispatcher,
  isBeginRenderingMessage,
  isSurfaceUpdateMessage,
  isDataModelUpdateMessage,
  isDeleteSurfaceMessage,
  isErrorMessage,
} from '../dispatcher/message-dispatcher';
import type {
  BeginRenderingMessage,
  SurfaceUpdateMessage,
  DataModelUpdateMessage,
  DeleteSurfaceMessage,
  ErrorMessage,
  A2UIMessage,
} from '../types/a2ui-types';

describe('createMessageDispatcher', () => {
  describe('dispatching messages', () => {
    it('should dispatch beginRendering messages', () => {
      const onBeginRendering = jest.fn();
      const dispatcher = createMessageDispatcher({
        handlers: { onBeginRendering },
      });

      const message: BeginRenderingMessage = {
        type: 'beginRendering',
        surfaceId: 'main',
        rootId: 'root',
      };

      dispatcher.dispatch(message);

      expect(onBeginRendering).toHaveBeenCalledTimes(1);
      expect(onBeginRendering).toHaveBeenCalledWith(message);
    });

    it('should dispatch surfaceUpdate messages', () => {
      const onSurfaceUpdate = jest.fn();
      const dispatcher = createMessageDispatcher({
        handlers: { onSurfaceUpdate },
      });

      const message: SurfaceUpdateMessage = {
        type: 'surfaceUpdate',
        surfaceId: 'main',
        components: [
          { id: 'text1', type: 'Text', content: 'Hello' },
        ],
      };

      dispatcher.dispatch(message);

      expect(onSurfaceUpdate).toHaveBeenCalledTimes(1);
      expect(onSurfaceUpdate).toHaveBeenCalledWith(message);
    });

    it('should dispatch dataModelUpdate messages', () => {
      const onDataModelUpdate = jest.fn();
      const dispatcher = createMessageDispatcher({
        handlers: { onDataModelUpdate },
      });

      const message: DataModelUpdateMessage = {
        type: 'dataModelUpdate',
        surfaceId: 'main',
        path: ['user', 'name'],
        value: 'John',
      };

      dispatcher.dispatch(message);

      expect(onDataModelUpdate).toHaveBeenCalledTimes(1);
      expect(onDataModelUpdate).toHaveBeenCalledWith(message);
    });

    it('should dispatch deleteSurface messages', () => {
      const onDeleteSurface = jest.fn();
      const dispatcher = createMessageDispatcher({
        handlers: { onDeleteSurface },
      });

      const message: DeleteSurfaceMessage = {
        type: 'deleteSurface',
        surfaceId: 'main',
      };

      dispatcher.dispatch(message);

      expect(onDeleteSurface).toHaveBeenCalledTimes(1);
      expect(onDeleteSurface).toHaveBeenCalledWith(message);
    });

    it('should dispatch error messages', () => {
      const onError = jest.fn();
      const dispatcher = createMessageDispatcher({
        handlers: { onError },
      });

      const message: ErrorMessage = {
        type: 'error',
        code: 'E001',
        message: 'Something went wrong',
      };

      dispatcher.dispatch(message);

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(message);
    });

    it('should dispatch unknown messages to onUnknown handler', () => {
      const onUnknown = jest.fn();
      const dispatcher = createMessageDispatcher({
        handlers: { onUnknown },
      });

      const message = {
        type: 'customExtension',
        data: { custom: 'value' },
      } as unknown as A2UIMessage;

      dispatcher.dispatch(message);

      expect(onUnknown).toHaveBeenCalledTimes(1);
      expect(onUnknown).toHaveBeenCalledWith(message);
    });
  });

  describe('lifecycle hooks', () => {
    it('should call onBeforeDispatch before handlers', () => {
      const callOrder: string[] = [];
      const onBeforeDispatch = jest.fn(() => callOrder.push('before'));
      const onBeginRendering = jest.fn(() => callOrder.push('handler'));

      const dispatcher = createMessageDispatcher({
        handlers: { onBeginRendering },
        onBeforeDispatch,
      });

      dispatcher.dispatch({
        type: 'beginRendering',
        surfaceId: 'main',
        rootId: 'root',
      });

      expect(callOrder).toEqual(['before', 'handler']);
    });

    it('should call onAfterDispatch after handlers', () => {
      const callOrder: string[] = [];
      const onAfterDispatch = jest.fn(() => callOrder.push('after'));
      const onBeginRendering = jest.fn(() => callOrder.push('handler'));

      const dispatcher = createMessageDispatcher({
        handlers: { onBeginRendering },
        onAfterDispatch,
      });

      dispatcher.dispatch({
        type: 'beginRendering',
        surfaceId: 'main',
        rootId: 'root',
      });

      expect(callOrder).toEqual(['handler', 'after']);
    });
  });

  describe('handler management', () => {
    it('should allow updating handlers dynamically', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      const dispatcher = createMessageDispatcher({
        handlers: { onBeginRendering: handler1 },
      });

      const message: BeginRenderingMessage = {
        type: 'beginRendering',
        surfaceId: 'main',
        rootId: 'root',
      };

      dispatcher.dispatch(message);
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(0);

      dispatcher.setHandlers({ onBeginRendering: handler2 });

      dispatcher.dispatch(message);
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should return current handlers', () => {
      const onBeginRendering = jest.fn();
      const onSurfaceUpdate = jest.fn();

      const dispatcher = createMessageDispatcher({
        handlers: { onBeginRendering, onSurfaceUpdate },
      });

      const handlers = dispatcher.getHandlers();

      expect(handlers.onBeginRendering).toBe(onBeginRendering);
      expect(handlers.onSurfaceUpdate).toBe(onSurfaceUpdate);
    });

    it('should handle missing handlers gracefully', () => {
      const dispatcher = createMessageDispatcher({
        handlers: {},
      });

      // Should not throw
      expect(() =>
        dispatcher.dispatch({
          type: 'beginRendering',
          surfaceId: 'main',
          rootId: 'root',
        })
      ).not.toThrow();
    });
  });
});

describe('message type guards', () => {
  describe('isBeginRenderingMessage', () => {
    it('should return true for beginRendering messages', () => {
      const message: A2UIMessage = {
        type: 'beginRendering',
        surfaceId: 'main',
        rootId: 'root',
      };
      expect(isBeginRenderingMessage(message)).toBe(true);
    });

    it('should return false for other message types', () => {
      const message: A2UIMessage = {
        type: 'surfaceUpdate',
        surfaceId: 'main',
        components: [],
      };
      expect(isBeginRenderingMessage(message)).toBe(false);
    });
  });

  describe('isSurfaceUpdateMessage', () => {
    it('should return true for surfaceUpdate messages', () => {
      const message: A2UIMessage = {
        type: 'surfaceUpdate',
        surfaceId: 'main',
        components: [],
      };
      expect(isSurfaceUpdateMessage(message)).toBe(true);
    });

    it('should return false for other message types', () => {
      const message: A2UIMessage = {
        type: 'beginRendering',
        surfaceId: 'main',
        rootId: 'root',
      };
      expect(isSurfaceUpdateMessage(message)).toBe(false);
    });
  });

  describe('isDataModelUpdateMessage', () => {
    it('should return true for dataModelUpdate messages', () => {
      const message: A2UIMessage = {
        type: 'dataModelUpdate',
        surfaceId: 'main',
        path: ['user'],
        value: 'John',
      };
      expect(isDataModelUpdateMessage(message)).toBe(true);
    });

    it('should return false for other message types', () => {
      const message: A2UIMessage = {
        type: 'surfaceUpdate',
        surfaceId: 'main',
        components: [],
      };
      expect(isDataModelUpdateMessage(message)).toBe(false);
    });
  });

  describe('isDeleteSurfaceMessage', () => {
    it('should return true for deleteSurface messages', () => {
      const message: A2UIMessage = {
        type: 'deleteSurface',
        surfaceId: 'main',
      };
      expect(isDeleteSurfaceMessage(message)).toBe(true);
    });

    it('should return false for other message types', () => {
      const message: A2UIMessage = {
        type: 'surfaceUpdate',
        surfaceId: 'main',
        components: [],
      };
      expect(isDeleteSurfaceMessage(message)).toBe(false);
    });
  });

  describe('isErrorMessage', () => {
    it('should return true for error messages', () => {
      const message: A2UIMessage = {
        type: 'error',
        code: 'E001',
        message: 'Error',
      };
      expect(isErrorMessage(message)).toBe(true);
    });

    it('should return false for other message types', () => {
      const message: A2UIMessage = {
        type: 'surfaceUpdate',
        surfaceId: 'main',
        components: [],
      };
      expect(isErrorMessage(message)).toBe(false);
    });
  });
});
