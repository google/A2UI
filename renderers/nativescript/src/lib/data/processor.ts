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

import { Types } from '@a2ui/lit/0.8';
import { Injectable } from '@angular/core';
import { firstValueFrom, Subject } from 'rxjs';

export interface DispatchedEvent {
  message: Types.A2UIClientEventMessage;
  completion: Subject<Types.ServerToClientMessage[]>;
}

/**
 * A simplified message processor for NativeScript that handles
 * data model operations and event dispatching.
 */
@Injectable({ providedIn: 'root' })
export class MessageProcessor implements Types.MessageProcessor {
  readonly events = new Subject<DispatchedEvent>();

  #surfaces: Map<string, Types.Surface> = new Map();

  getSurfaces(): ReadonlyMap<string, Types.Surface> {
    return this.#surfaces;
  }

  clearSurfaces(): void {
    this.#surfaces.clear();
  }

  processMessages(messages: Types.ServerToClientMessage[]): void {
    // Process incoming messages and update surfaces
    for (const message of messages) {
      if (message.beginRendering) {
        const surfaceId = message.beginRendering.surfaceId;
        if (!this.#surfaces.has(surfaceId)) {
          this.#surfaces.set(surfaceId, {
            rootComponentId: message.beginRendering.root,
            componentTree: null,
            dataModel: new Map(),
            components: new Map(),
            styles: message.beginRendering.styles ?? {},
          });
        }
      }
      // Handle other message types as needed
    }
  }

  getData(
    node: Types.AnyComponentNode,
    relativePath: string,
    surfaceId?: string,
  ): Types.DataValue | null {
    // For now, return null - implement data binding as needed
    return null;
  }

  setData(
    node: Types.AnyComponentNode | null,
    relativePath: string,
    value: Types.DataValue,
    surfaceId?: Types.SurfaceID | null,
  ): void {
    // Implement data setting as needed
  }

  resolvePath(path: string, dataContextPath?: string): string {
    if (!dataContextPath || path.startsWith('/')) {
      return path;
    }
    return `${dataContextPath}/${path}`;
  }

  dispatch(message: Types.A2UIClientEventMessage): Promise<Types.ServerToClientMessage[]> {
    const completion = new Subject<Types.ServerToClientMessage[]>();
    this.events.next({ message, completion });
    return firstValueFrom(completion);
  }
}
