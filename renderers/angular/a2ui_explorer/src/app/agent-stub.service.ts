/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Injectable } from '@angular/core';
import { A2uiRendererService } from '@a2ui/angular/v0_9';
import { SurfaceGroupAction, A2uiMessage } from '@a2ui/web_core/v0_9';
import { ActionDispatcher } from './action-dispatcher.service';

/**
 * Context for the 'update_property' event.
 */
interface UpdatePropertyContext {
  path: string;
  value: any;
  surfaceId?: string;
}

/**
 * Context for the 'submit_form' event.
 */
interface SubmitFormContext {
  [key: string]: any;
  name?: string;
}

/**
 * A stub service that simulates an A2UI agent.
 * It listens for actions and responds with data model updates or new surfaces.
 */
@Injectable({
  providedIn: 'root',
})
export class AgentStubService {
  /** Log of actions received from the surface. */
  actionsLog: Array<{ timestamp: Date; action: SurfaceGroupAction }> = [];

  constructor(
    private rendererService: A2uiRendererService,
     private dispatcher: ActionDispatcher,
  ) {
    // Subscribe to actions dispatched by the renderer
    this.dispatcher.actions.subscribe((action) => this.handleAction(action));
  }

  /**
   * Pushes actions triggered from the rendered Canvas frame through simulation.
   * - Logs actions into inspector event frame aggregates.
   * - Emulates generic server-side evaluation triggers delaying deferred updates.
   * - Dispatch subsequent node-tree node triggers back over `A2uiRendererService`.
   */
  handleAction(action: SurfaceGroupAction) {
    console.log('[AgentStub] handleAction action:', action);
    this.actionsLog.push({ timestamp: new Date(), action });

    // Simulate server processing delay
    setTimeout(() => {
      if ('event' in action) {
        const { name, context } = action.event;
        if (name === 'update_property' && context) {
          const { path, value, surfaceId } = context as unknown as UpdatePropertyContext;
          console.log(
            '[AgentStub] update_property path:',
            path,
            'value:',
            value,
            'surfaceId:',
            surfaceId,
          );
          this.rendererService.processMessages([
            {
              version: 'v0.9',
              updateDataModel: {
                surfaceId: surfaceId || action.surfaceId,
                path: path,
                value: value,
              },
            },
          ]);
        } else if (name === 'submit_form' && context) {
          const formData = context as unknown as SubmitFormContext;
          const nameValue = formData.name || 'Anonymous';

          // Respond with an update to the data model in v0.9 layout
          this.rendererService.processMessages([
            {
              version: 'v0.9',
              updateDataModel: {
                surfaceId: action.surfaceId,
                path: '/form/submitted',
                value: true,
              },
            },
            {
              version: 'v0.9',
              updateDataModel: {
                surfaceId: action.surfaceId,
                path: '/form/responseMessage',
                value: `Hello, ${nameValue}! Your form has been processed.`,
              },
            },
          ]);
        }
      }
    }, 50); // Shorter delay for property updates
  }

  /**
   * Initializes a demo session with an initial set of messages.
   */
  initializeDemo(initialMessages: A2uiMessage[]) {
    this.rendererService.processMessages(initialMessages);
  }
}
