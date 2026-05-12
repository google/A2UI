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

@Injectable({
  providedIn: 'root',
})
export class AgentStubV09Service {
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

@Injectable({
  providedIn: 'root',
})
export class AgentStubV08Service {
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

@Injectable({
  providedIn: 'root',
})
export class AgentStubService {
  private surfaceVersions = new Map<string, '0.8' | '0.9'>();

  constructor(
    private v09Service: AgentStubV09Service,
    private v08Service: AgentStubV08Service,
  ) {}

  get actionsLog() {
    return [...this.v09Service.actionsLog, ...this.v08Service.actionsLog].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );
  }

  initializeDemo(initialMessages: A2uiMessage[] | ServerToClientMessage[]) {
    const isV09 = initialMessages.some(msg => 'version' in msg && msg.version === 'v0.9');
    const version = isV09 ? '0.9' : '0.8';

    for (const msg of initialMessages) {
      if ('createSurface' in msg) {
        this.surfaceVersions.set(msg.createSurface.surfaceId, version);
      } else if ('surfaceUpdate' in msg) {
        this.surfaceVersions.set((msg as any).surfaceUpdate.surfaceId, version);
      }
    }

    if (isV09) {
      this.v09Service.initializeDemo(initialMessages as A2uiMessage[]);
    } else {
      this.v08Service.initializeDemo(initialMessages as ServerToClientMessage[]);
    }
  }

  handleAction(action: A2uiClientAction) {
    const version = this.surfaceVersions.get(action.surfaceId) || '0.9';
    if (version === '0.9') {
      this.v09Service.handleAction(action);
    } else {
      this.v08Service.handleAction(action);
    }
  }
}
