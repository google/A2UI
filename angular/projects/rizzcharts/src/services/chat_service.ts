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

import { Artifact, DataPart, Message, Part, Task, TextPart } from '@a2a-js/sdk';
import { ModelProcessor } from '@a2ui/angular';
import * as v0_8 from '@a2ui/web-lib/0.8';
import { inject, Injectable, signal } from '@angular/core';
import { UiMessage, UiMessageContent } from '@rizzcharts/types/ui_message';
import { v4 as uuid } from 'uuid';
import { A2aService } from './a2a_service';

@Injectable({
  // Make it a singleton across the entire app
  providedIn: 'root',
})
export class ChatService {
  readonly a2aService = inject(A2aService);
  readonly processor = inject(ModelProcessor);
  readonly surfaces = signal(new Map(this.processor.getSurfaces()));
  readonly history = signal<UiMessage[]>([]);
  readonly contextId = signal<string>('');
  readonly isA2aStreamOpen = signal(false);

  public componentCatalog: string = '';

  constructor() {
    this.processor.events.subscribe(async (event) => {
      try {
        await this.sendMessage(event.message);
        event.completion.next([]);
        event.completion.complete();
      } catch (err) {
        event.completion.error(err);
      }
    });
  }

  async sendMessage(message: v0_8.Types.A2UIClientEventMessage | string) {
    const now = new Date().toISOString();
    const newUserMessage: UiMessage = {
      type: 'ui_message',
      id: uuid(),
      context_id: this.contextId(),
      role: {
        type: 'ui_user',
      },
      contents: this.createUserMessageContents(message),
      status: 'pending',
      created: now,
      lastUpdated: now,
    };
    const newAgentMessage: UiMessage = {
      type: 'ui_message',
      id: uuid(),
      context_id: this.contextId(),
      role: {
        type: 'ui_agent',
        name: 'MyCharts Agent',
        icon_url: 'rizz-agent.png',
      },
      contents: [],
      status: 'pending',
      created: now,
      lastUpdated: now,
    };

    this.history.update((curr) => [...curr, newUserMessage, newAgentMessage]);
    this.surfaces.set(new Map(this.processor.getSurfaces()));

    this.isA2aStreamOpen.set(true);

    const a2aResponse = await this.a2aService.sendMessage(
      {
        clientUiCapabilities: {
          catalogUri: this.componentCatalog,
        },
        request: [this.createUserMessagePart(message)],
      },
      this.contextId(),
    );

    const result = (a2aResponse as any).result;
    const newContextId = result?.contextId;

    if (newContextId) {
      this.contextId.set(newContextId);
    }

    let agentResponseParts: Part[] = [];

    if (a2aResponse.result.kind === 'task') {
      const task: Task = a2aResponse.result;
      const taskStatusParts = task.status.message?.parts ?? [];
      const artifactParts = (task.artifacts ?? []).flatMap((artifact: Artifact) => {
        return artifact.parts;
      })
      agentResponseParts = taskStatusParts.concat(artifactParts);      
    } else {
      const message: Message = a2aResponse.result;
      agentResponseParts = message.parts;
    }

    const a2uiDataParts = agentResponseParts
      .map((part): v0_8.Types.ServerToClientMessage | null => {
        if (part.kind === 'data') {
          if (part.data['beginRendering']) {
            return {
              beginRendering: part.data['beginRendering'] as v0_8.Types.BeginRenderingMessage,
            };
          } else if (part.data['surfaceUpdate']) {
            return {
              surfaceUpdate: part.data['surfaceUpdate'] as v0_8.Types.SurfaceUpdateMessage,
            };
          } else if (part.data['dataModelUpdate']) {
            return {
              dataModelUpdate: part.data['dataModelUpdate'] as v0_8.Types.DataModelUpdate,
            };
          } else if (part.data['deleteSurface']) {
            return {
              deleteSurface: part.data['deleteSurface'] as v0_8.Types.DeleteSurfaceMessage,
            };
          }
        }

        return null;
      })
      .filter((message) => !!message);
    console.log('a2a parts: ', agentResponseParts);
    console.log('a2ui parts: ', JSON.stringify(a2uiDataParts));
    this.processor.processMessages(a2uiDataParts);

    newAgentMessage.contents.push(
      ...agentResponseParts
        .filter((part) => {
          return part.kind === 'text' || (part.kind === 'data' && 'beginRendering' in part.data);
        })
        .map(
          (part): UiMessageContent => ({
            type: 'ui_message_content',
            id: uuid(),
            data: part,
          }),
        ),
    );

    this.isA2aStreamOpen.set(false);
    this.history.update((history) => {
      // New reference of the same object for OnPush ChangeDetectionStrategy.
      return [
        ...history.slice(0, -1),
        { ...newAgentMessage, lastUpdated: new Date().toISOString(), status: 'completed' },
      ];
    });
    this.surfaces.set(new Map(this.processor.getSurfaces()));
  }

  private createUserMessagePart(message: v0_8.Types.A2UIClientEventMessage | string) {
    if (typeof message === 'string') {
      return {
        kind: 'text',
        text: message,
      } as TextPart;
    }

    return {
      kind: 'data',
      data: message as any,
      mimeType: 'application/json+a2aui',
    } as DataPart;
  }

  private createUserMessageContents(
    message: v0_8.Types.A2UIClientEventMessage | string,
  ): UiMessageContent[] {
    if (typeof message === 'string') {
      return [
        {
          type: 'ui_message_content',
          id: uuid(),
          data: this.createUserMessagePart(message),
        },
      ] as UiMessageContent[];
    }

    const userVisibleText = message.userAction?.name;
    if (!userVisibleText) {
      return [];
    }

    return [
      {
        type: 'ui_message_content',
        id: uuid(),
        data: {
          kind: 'text',
          text: userVisibleText,
        },
      },
    ] as UiMessageContent[];
  }
}
