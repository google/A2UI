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

import { Injectable, inject } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import * as WebCore from '@a2ui/web_core/v0_8';
import { Catalog } from '../rendering/catalog';
import { Theme } from '../rendering/theming';
import { Types } from '../types';

export interface A2UIClientEvent {
  message: Types.A2UIClientEventMessage;
  completion: Subject<Types.ServerToClientMessage[]>;
}

export type DispatchedEvent = A2UIClientEvent;

@Injectable({
  providedIn: 'root',
})
export class MessageProcessor {
  private readonly catalog = inject(Catalog);
  private baseProcessor: WebCore.A2uiMessageProcessor;

  private readonly eventsSubject = new Subject<A2UIClientEvent>();
  readonly events: Observable<A2UIClientEvent> = this.eventsSubject.asObservable();

  constructor() {
    this.baseProcessor = new WebCore.A2uiMessageProcessor();
  }

  processMessages(messages: Types.ServerToClientMessage[]) {
    this.baseProcessor.processMessages(messages as WebCore.ServerToClientMessage[]);
  }

  dispatch(message: Types.A2UIClientEventMessage): Promise<Types.ServerToClientMessage[]> {
    const completion = new Subject<Types.ServerToClientMessage[]>();
    const promise = new Promise<Types.ServerToClientMessage[]>((resolve, reject) => {
      completion.subscribe({
        next: (msgs) => resolve(msgs),
        error: (err) => reject(err),
      });
    });

    this.eventsSubject.next({ message, completion });
    return promise;
  }

  getData(node: Types.AnyComponentNode, path: string, surfaceId?: string | null): unknown {
    return this.baseProcessor.getData(node as WebCore.AnyComponentNode, path, surfaceId ?? undefined);
  }

  setData(node: Types.AnyComponentNode | null, path: string, value: any, surfaceId: string) {
    this.baseProcessor.setData(node as WebCore.AnyComponentNode | null, path, value, surfaceId);
  }

  resolvePath(path: string, dataContextPath?: string): string {
    return this.baseProcessor.resolvePath(path, dataContextPath);
  }

  getSurfaces(): Map<string, WebCore.Surface> {
    return (this.baseProcessor as any).surfaces || new Map();
  }

  clearSurfaces() {
    this.baseProcessor.clearSurfaces();
  }
}
