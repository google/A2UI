/** Standard cleanup interface returned by all subscriptions. */
export interface Subscription {
  unsubscribe(): void;
}

/** The listener function signature. */
export type EventListener<T> = (data: T) => void | Promise<void>;

/** 
 * Public interface exposed by models. 
 * Allows ONLY subscribing to events.
 */
export interface EventSource<T> {
  subscribe(listener: EventListener<T>): Subscription;
}

/** 
 * Internal implementation used by the model. 
 * Implements EventSource but also provides the 'emit' method.
 */
export class EventEmitter<T> implements EventSource<T> {
  private listeners = new Set<EventListener<T>>();

  subscribe(listener: EventListener<T>): Subscription {
    this.listeners.add(listener);
    return {
      unsubscribe: () => this.listeners.delete(listener)
    };
  }

  async emit(data: T): Promise<void> {
    for (const listener of this.listeners) {
      try {
        await listener(data);
      } catch (e) {
        console.error('EventEmitter error:', e);
      }
    }
  }

  dispose(): void {
    this.listeners.clear();
  }
}
