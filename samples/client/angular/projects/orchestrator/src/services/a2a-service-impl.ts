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

import { AgentCard, Part, SendMessageSuccessResponse } from '@a2a-js/sdk';
import { A2aService } from '@a2a_chat_canvas/interfaces/a2a-service';
import { Injectable, inject, Injector } from '@angular/core';
import { MessageProcessor } from '@a2ui/angular';

@Injectable({
  providedIn: 'root',
})
export class A2aServiceImpl implements A2aService {

  private readonly messageProcessor = inject(MessageProcessor);
  private readonly injector = inject(Injector);

  async sendMessage(parts: Part[], signal?: AbortSignal): Promise<SendMessageSuccessResponse> {
    const response = await fetch('/a2a', {
      body: JSON.stringify({
        parts: parts,
        metadata: {
          a2uiClientCapabilities: {
            supportedCatalogIds: ['https://a2ui.org/specification/v0_8/standard_catalog_definition.json']
          },
          streaming: true
        }
      }),
      method: 'POST',
      signal,
    });

    if (!response.ok) {
      const error = (await response.json()) as { error: string };
      throw new Error(error.error);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('text/event-stream')) {
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      const accumulatedParts: Part[] = [];

      let containerMounted = false;
      const chatServicePromise = import('@a2a_chat_canvas/services/chat-service').then(m => this.injector.get(m.ChatService));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);
            try {
              const parsed = JSON.parse(jsonStr);
              if (Array.isArray(parsed)) {
                for (const part of parsed) {
                  if (part.data && (part.data.surfaceUpdate || part.data.dataModelUpdate || part.data.beginRendering)) {
                    (this.messageProcessor as any).processMessages([part.data]);
                    chatServicePromise.then((cs: any) => {
                      cs.a2uiSurfaces.set(new Map((this.messageProcessor as any).getSurfaces()));
                      if (!containerMounted && part.data.beginRendering) {
                        containerMounted = true;
                        import('@a2a_chat_canvas/utils/ui-message-utils').then(u => {
                          cs.history.update((history: any[]) => {
                            if (history.length === 0) return history;
                            const last = history[history.length - 1];
                            return [...history.slice(0, -1), {
                              ...last,
                              contents: [...last.contents, u.convertPartToUiMessageContent(part, cs.partResolvers)],
                              lastUpdated: new Date().toISOString(),
                            }];
                          });
                        });
                      }
                    });
                  }
                }
              }
            } catch (e) {
              console.error('SSE parse error', e);
            }
          }
        }
      }

      return {
        result: {
          kind: 'task',
          status: {
            message: {
              kind: 'message',
              role: 'agent',
              parts: [],
            }
          }
        }
      } as unknown as SendMessageSuccessResponse;
    }

    const data = await response.json();
    return data;
  }

  async getAgentCard(): Promise<AgentCard> {
    const response = await fetch('/a2a/agent-card');
    if (!response.ok) {
      throw new Error('Failed to fetch agent card');
    }
    const card = await response.json() as AgentCard;
    return card;
  }
}
