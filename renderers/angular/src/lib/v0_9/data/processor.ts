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

import { MessageProcessor as A2uiMessageProcessor } from '@a2ui/web_core/v0_9';
import * as Types from '@a2ui/web_core/v0_9';
import { BASIC_FUNCTIONS } from '@a2ui/web_core/v0_9/basic_catalog';
import { Inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, Subject } from 'rxjs';
import { Catalog, CatalogToken } from '../rendering/catalog';

export interface A2uiClientMessage {
  version: 'v0.9';
  action?: {
    name: string;
    surfaceId: string;
    sourceComponentId: string;
    timestamp: string;
    context: Record<string, any>;
    event?: {
      name: string;
      context?: Record<string, any>;
    };
    functionCall?: {
      name: string;
      args?: Record<string, any>;
    };
  };
  error?: {
    code: string;
    message: string;
    surfaceId: string;
    path?: string;
  };
}

export interface DispatchedEvent {
  message: A2uiClientMessage;
  completion: Subject<Types.A2uiMessage[]>;
}

@Injectable({ providedIn: 'root' })
export class MessageProcessor extends A2uiMessageProcessor<any> {
  constructor(@Inject(CatalogToken) catalog: Catalog) {
    super(
      [catalog],
      (action) => {
        console.log('Action dispatched:', action);
      },
    );
    this.model.onSurfaceCreated.subscribe(() => this.updateSurfaces());
    this.model.onSurfaceDeleted.subscribe(() => this.updateSurfaces());
    this.updateSurfaces();
  }
  readonly events = new Subject<DispatchedEvent>();
  readonly surfaces = signal<[string, any][]>([]);

  private updateSurfaces() {
    this.surfaces.set(Array.from(this.model.surfacesMap.entries()));
  }

  // v0.8 A2uiMessageProcessor had getSurfaces, v0.9 does not (it has model.surfacesMap)
  // We re-implement it here for compatibility with the Angular template.
  getSurfaces(): ReadonlyMap<string, any> {
    return this.model.surfacesMap;
  }

  clearSurfaces() {
    for (const surfaceId of this.model.surfacesMap.keys()) {
      this.model.deleteSurface(surfaceId);
    }
  }

  // Override to handle the fact that we're using a different base class
  // The base class processMessages expects v0.9 messages.
  // We trust the server sends valid v0.9 messages.
  override processMessages(messages: any[]): void {
    console.log('[MessageProcessor] Received messages to process:', messages);
    try {
      super.processMessages(messages);
      console.log('[MessageProcessor] Finished processing messages.');
      console.log('[MessageProcessor] Current surfaces:', Array.from(this.getSurfaces().entries()));
    } catch (e) {
      console.error('[MessageProcessor] Error processing messages:', e);
    }
  }

  dispatch(message: A2uiClientMessage): Promise<Types.A2uiMessage[]> {
    const completion = new Subject<Types.A2uiMessage[]>();
    this.events.next({ message, completion });
    return firstValueFrom(completion);
  }
}

