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

import {Injectable, signal, computed} from '@angular/core';
import {MessageProcessor as MessageProcessorV08, Theme as ThemeV08} from '@a2ui/angular/v0_8';
import {A2uiClientAction} from '@a2ui/web_core/v0_9';
import {ServerToClientMessage} from 'src/v0_8/types';
import {AgentStubService} from './agent-stub.service';

/**
 * Context for the 'update_property' event.
 */
interface UpdatePropertyContext {
  path: string;
  value: any;
  surfaceId?: string;
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
  eventsLog = signal<Array<{timestamp: Date; action: A2uiClientAction}>>([]);
  surfaceId = signal<string>('demo-surface', {equal: () => false});
  currentCreateSurfaceMessage = signal<ServerToClientMessage[] | null>(null);
  private actionSub?: {unsubscribe: () => void};

  dataModel = computed(() => {
    this.messageProcessorV08.version();
    const surfaceId = this.surfaceId();
    if (!surfaceId) return {};
    const surfaces = this.messageProcessorV08.getSurfaces();
    const surface = surfaces.get(surfaceId);
    if (surface) {
      return this.messageProcessorV08.getData({id: 'root'} as any, '/', surfaceId) as Record<
        string,
        unknown
      >;
    }
    return {};
  });

  constructor(
    private messageProcessorV08: MessageProcessorV08,
    private themeV08: ThemeV08,
  ) {}

  handleAction(action: A2uiClientAction) {
    console.log('[AgentStubV08] handleAction action:', action);

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
    this.themeV08.update(this.getDefault08Theme());

    const surfaceUpdate = initialMessages.find(m => 'surfaceUpdate' in m) as
      | ServerToClientMessage
      | undefined;
    const newSurfaceId = surfaceUpdate?.surfaceUpdate?.surfaceId ?? 'demo-surface';
    this.currentCreateSurfaceMessage.set(initialMessages);

    this.eventsLog.set([]);
    if (this.actionSub) {
      this.actionSub.unsubscribe();
    }
    this.actionSub = this.messageProcessorV08.events.subscribe(event => {
      const message = event.message;
      if (message.userAction) {
        const action = message.userAction as unknown as A2uiClientAction;
        this.handleAction(action);
        this.eventsLog.update(log => [
          {timestamp: new Date(), action: {userAction: action} as any},
          ...log,
        ]);
      }
    });

    this.messageProcessorV08.processMessages(initialMessages);

    this.surfaceId.set('');
    setTimeout(() => {
      this.surfaceId.set(newSurfaceId);
    }, 0);
  }

  private getDefault08Theme() {
    return {
      components: {
        AudioPlayer: {},
        Text: {all: {}, h1: {}, h2: {}, h3: {}, h4: {}, h5: {}, body: {}, caption: {}},
        CheckBox: {container: {}, element: {}, label: {}},
        DateTimeInput: {container: {}, element: {}, label: {}},
        List: {},
        Modal: {backdrop: {}, element: {}},
        MultipleChoice: {container: {}, element: {}, label: {}},
        Tabs: {
          container: {},
          element: {},
          controls: {
            all: {},
            selected: {},
          },
        },
        Slider: {container: {}, element: {}, label: {}},
        TextField: {container: {}, element: {}, label: {}},
        Video: {},
        Card: {},
        Row: {},
        Column: {},
        Image: {
          all: {},
          icon: {},
          avatar: {},
          smallFeature: {},
          mediumFeature: {},
          largeFeature: {},
          header: {},
        },
        Divider: {},
        Icon: {},
        Button: {},
      },
      elements: {
        a: {},
        audio: {},
        body: {},
        button: {},
        h1: {},
        h2: {},
        h3: {},
        h4: {},
        h5: {},
        iframe: {},
        input: {},
        p: {},
        pre: {},
        textarea: {},
        video: {},
      },
      markdown: {
        p: [],
        h1: [],
        h2: [],
        h3: [],
        h4: [],
        h5: [],
        ul: [],
        ol: [],
        li: [],
        a: [],
        strong: [],
        em: [],
      },
    };
  }
}
