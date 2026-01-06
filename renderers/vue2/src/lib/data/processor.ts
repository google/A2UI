/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import { Data, Types } from '@a2ui/lit/0.8';

/**
 * Injection key for the message processor.
 * Used with Vue's provide/inject pattern.
 */
export const PROCESSOR_KEY = '$a2uiProcessor';

/**
 * Represents a dispatched event waiting for the host application to handle.
 */
export interface DispatchedEvent {
  message: Types.A2UIClientEventMessage;
  resolve: (value: Types.ServerToClientMessage[]) => void;
  reject: (error: Error) => void;
}

/**
 * MessageProcessor extends the base A2uiMessageProcessor from @a2ui/lit
 * and adds Vue-specific event dispatching.
 *
 * The processor manages:
 * - Surface state and component trees
 * - Data model updates
 * - User action dispatching
 *
 * Host applications should:
 * 1. Call processMessages() with incoming server messages
 * 2. Watch pendingEvents and handle user actions
 * 3. Call resolveEvent() when actions are processed
 */
export class MessageProcessor extends Data.A2uiMessageProcessor {
  private _pendingEvents: DispatchedEvent[] = [];
  private _eventListeners: Array<(event: DispatchedEvent) => void> = [];

  /**
   * Returns the list of pending events waiting to be handled.
   */
  get pendingEvents(): readonly DispatchedEvent[] {
    return this._pendingEvents;
  }

  /**
   * Override setData to convert null to undefined for proper fallback handling.
   */
  override setData(
    node: Types.AnyComponentNode,
    relativePath: string,
    value: Types.DataValue,
    surfaceId?: Types.SurfaceID | null
  ): void {
    return super.setData(node, relativePath, value, surfaceId ?? undefined);
  }

  /**
   * Dispatches a client event message and returns a promise that resolves
   * when the host application handles the event.
   *
   * @param message - The client event message to dispatch
   * @returns Promise resolving to server response messages
   */
  dispatch(message: Types.A2UIClientEventMessage): Promise<Types.ServerToClientMessage[]> {
    return new Promise((resolve, reject) => {
      const event: DispatchedEvent = { message, resolve, reject };
      this._pendingEvents.push(event);
      this._notifyListeners(event);
    });
  }

  /**
   * Called by the host application to resolve a pending event.
   *
   * @param event - The event to resolve
   * @param response - The server response messages
   */
  resolveEvent(event: DispatchedEvent, response: Types.ServerToClientMessage[]): void {
    const index = this._pendingEvents.indexOf(event);
    if (index > -1) {
      this._pendingEvents.splice(index, 1);
      event.resolve(response);
    }
  }

  /**
   * Called by the host application to reject a pending event.
   *
   * @param event - The event to reject
   * @param error - The error that occurred
   */
  rejectEvent(event: DispatchedEvent, error: Error): void {
    const index = this._pendingEvents.indexOf(event);
    if (index > -1) {
      this._pendingEvents.splice(index, 1);
      event.reject(error);
    }
  }

  /**
   * Registers a listener to be notified when new events are dispatched.
   *
   * @param listener - The listener function
   * @returns Unsubscribe function
   */
  onEvent(listener: (event: DispatchedEvent) => void): () => void {
    this._eventListeners.push(listener);
    return () => {
      const index = this._eventListeners.indexOf(listener);
      if (index > -1) {
        this._eventListeners.splice(index, 1);
      }
    };
  }

  private _notifyListeners(event: DispatchedEvent): void {
    for (const listener of this._eventListeners) {
      try {
        listener(event);
      } catch (e) {
        console.error('Error in event listener:', e);
      }
    }
  }
}
