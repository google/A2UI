import { Data, Types } from '@a2ui/lit/0.8';

export interface DispatchedEvent {
  message: Types.A2UIClientEventMessage;
  resolve: (messages: Types.ServerToClientMessage[]) => void;
  reject: (error: Error) => void;
}

export type EventListener = (event: DispatchedEvent) => void;

/**
 * React-specific MessageProcessor that extends the base A2uiMessageProcessor
 * and adds event dispatching capabilities for user actions.
 */
export class MessageProcessor extends Data.A2uiMessageProcessor {
  private listeners: Set<EventListener> = new Set();

  /**
   * Subscribe to dispatched events (user actions).
   * Returns an unsubscribe function.
   */
  subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Dispatch a user action event and return a promise that resolves
   * with the server's response messages.
   */
  dispatch(message: Types.A2UIClientEventMessage): Promise<Types.ServerToClientMessage[]> {
    return new Promise((resolve, reject) => {
      const event: DispatchedEvent = { message, resolve, reject };
      this.listeners.forEach(listener => listener(event));
    });
  }

  /**
   * Override setData to handle null surfaceId (convert to undefined for base class)
   */
  override setData(
    node: Types.AnyComponentNode,
    relativePath: string,
    value: Types.DataValue,
    surfaceId?: Types.SurfaceID | null
  ): void {
    super.setData(node, relativePath, value, surfaceId ?? undefined);
  }
}
