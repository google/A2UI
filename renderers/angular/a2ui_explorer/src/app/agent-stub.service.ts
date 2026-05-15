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

import {Injectable} from '@angular/core';
import {A2uiRendererService} from '@a2ui/angular/v0_9';
import {MessageProcessor as MessageProcessorV08} from '@a2ui/angular/v0_8';
import {A2uiClientAction, A2uiMessage} from '@a2ui/web_core/v0_9';
import {ServerToClientMessage} from 'src/v0_8/types';

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
 * Abstract base class for agent stub services.
 */
export abstract class AgentStubService {
  abstract get actionsLog(): Array<{timestamp: Date; action: A2uiClientAction}>;
  abstract initializeDemo(initialMessages: A2uiMessage[] | ServerToClientMessage[]): void;
  abstract handleAction(action: A2uiClientAction): void;
}

/**
 * A stub service that simulates an A2UI agent.
 * It listens for actions and responds with data model updates or new surfaces.
 * Supports the v0.9 A2UI spec.
 */
@Injectable({
  providedIn: 'root',
})
export class AgentStubV09Service implements AgentStubService {
  actionsLog: Array<{timestamp: Date; action: A2uiClientAction}> = [];

  constructor(private rendererService: A2uiRendererService) {}

  handleAction(action: A2uiClientAction) {
    console.log('[AgentStubV09] handleAction action:', action);
    this.actionsLog.push({timestamp: new Date(), action});

    setTimeout(() => {
      const {name, context} = action;
      if (name === 'update_property' && context) {
        const {path, value, surfaceId} = context as unknown as UpdatePropertyContext;
        console.log(
          '[AgentStubV09] update_property path:',
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
    }, 50);
  }

  initializeDemo(initialMessages: A2uiMessage[]) {
    if (this.rendererService.surfaceGroup) {
      for (const msg of initialMessages) {
        if ('createSurface' in msg) {
          const createSurface = msg.createSurface;
          if (this.rendererService.surfaceGroup.getSurface(createSurface.surfaceId)) {
            this.rendererService.processMessages([
              {
                version: 'v0.9',
                deleteSurface: {surfaceId: createSurface.surfaceId},
              },
            ]);
          }
        }
      }
    }
    this.rendererService.processMessages(initialMessages);
  }
}

/**
 * A stub service that simulates an A2UI agent.
 * It listens for actions and responds with data model updates or new surfaces.
 * Supports the v0.8 A2UI spec.
 */
@Injectable({
  providedIn: 'root',
})
export class AgentStubV08Service implements AgentStubService {
  actionsLog: Array<{timestamp: Date; action: A2uiClientAction}> = [];

  constructor(private messageProcessorV08: MessageProcessorV08) {}

  handleAction(action: A2uiClientAction) {
    console.log('[AgentStubV08] handleAction action:', action);
    this.actionsLog.push({timestamp: new Date(), action});

    setTimeout(() => {
      const {name, context} = action;
      if (name === 'update_property' && context) {
        const {path, value, surfaceId} = context as unknown as UpdatePropertyContext;
        this.messageProcessorV08.processMessages([
          {
            dataModelUpdate: {
              surfaceId: surfaceId || action.surfaceId,
              path: path,
              contents: [
                {
                  key: path.substring(1),
                  valueString: String(value),
                },
              ],
            },
          },
        ]);
      }
    }, 50);
  }

  initializeDemo(initialMessages: ServerToClientMessage[]) {
    this.messageProcessorV08.processMessages(initialMessages);
  }
}


