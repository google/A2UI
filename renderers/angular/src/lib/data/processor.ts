/*
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { A2uiMessageProcessor } from '@a2ui/web_core/v0_8';
import * as Types from '@a2ui/web_core/v0_8';
import { Injectable } from '@angular/core';
import { firstValueFrom, Subject } from 'rxjs';

/**
 * Represents an event that has been dispatched through the MessageProcessor.
 *
 * This interface combines the original message with a completion subject that
 * is used to signal the end of processing and return the server's response.
 */
export interface DispatchedEvent {
  message: Types.A2UIClientEventMessage;
  completion: Subject<Types.ServerToClientMessage[]>;
}

/**
 * Angular-specific implementation of A2uiMessageProcessor.
 *
 * This service handles data synchronization and event dispatching for the A2UI renderer.
 * It extends the core message processor and adapts it to work with Angular's dependency
 * injection and RxJS-based event system.
 */
@Injectable({ providedIn: 'root' })
export class MessageProcessor extends A2uiMessageProcessor {
  constructor() {
    super();
  }
  /**
   * Observable stream of dispatched events.
   *
   * External handlers (e.g., an A2aService) should subscribe to this stream to
   * catch and process client-side events.
   */
  readonly events = new Subject<DispatchedEvent>();

  override setData(
    node: Types.AnyComponentNode,
    relativePath: string,
    value: Types.DataValue,
    surfaceId?: Types.SurfaceID | null,
  ) {
    // Override setData to convert from optional inputs (which can be null)
    // to undefined so that this correctly falls back to the default value for
    // surfaceId.
    return super.setData(node, relativePath, value, surfaceId ?? undefined);
  }

  /**
   * Dispatches a client event message for processing and returns a promise that resolves
   * with the server's response.
   *
   * This method is called by DynamicComponent.sendAction to signal user interactions (e.g., clicks,
   * form submissions) that need to be handled by the backend or agent.
   *
   * @param message The client event message to dispatch.
   * @returns A promise that resolves to an array of messages from the server in response to the event.
   *
   * @example
   * ```typescript
   * const response = await messageProcessor.dispatch({
   *   event: {
   *     type: 'click',
   *     componentId: 'my-button',
   *   },
   * });
   * ```
   */
  dispatch(message: Types.A2UIClientEventMessage): Promise<Types.ServerToClientMessage[]> {
    const completion = new Subject<Types.ServerToClientMessage[]>();
    const promise = firstValueFrom(completion);
    this.events.next({ message, completion });
    return promise;
  }
}
