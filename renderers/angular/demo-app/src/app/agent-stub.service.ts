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
import { A2uiRendererService } from '../../../src/lib/v0_9/core/a2ui-renderer.service';

/**
 * A stub service that simulates an A2UI agent.
 * It listens for actions and responds with data model updates or new surfaces.
 */
@Injectable({
  providedIn: 'root',
})
export class AgentStubService {
  /** Log of actions received from the surface. */
  actionsLog: any[] = [];

  constructor(private rendererService: A2uiRendererService) {}

  /**
   * Pushes actions triggered from the rendered Canvas frame through simulation.
   * - Logs actions into inspector event frame aggregates.
   * - Emulates generic server-side evaluation triggers delaying deferred updates.
   * - Dispatch subsequent node-tree node triggers back over `A2uiRendererService`.
   */
  handleAction(action: any) {
    console.log('[AgentStub] handleAction action:', action);
    this.actionsLog.push({ timestamp: new Date(), action });

    // Simulate server processing delay
    setTimeout(() => {
      if (action.event?.name === 'update_property') {
        const { path, value, surfaceId } = action.event.context;
        console.log('[AgentStub] update_property path:', path, 'value:', value, 'surfaceId:', surfaceId);
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
      } else if (action.event?.name === 'submit_form') {
        const formData = action.event.context;
        const name = formData.name || 'Anonymous';

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
                value: `Hello, ${name}! Your form has been processed.`,
              },
            },
          ]);
      }
    }, 50); // Shorter delay for property updates
  }

  /**
   * Initializes a demo session with an initial set of messages.
   */
  initializeDemo(initialMessages: any[]) {
    this.rendererService.initialize((action) => this.handleAction(action));
    this.rendererService.processMessages(initialMessages);
  }
}
