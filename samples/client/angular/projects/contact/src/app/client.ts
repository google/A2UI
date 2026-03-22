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

import { A2AServerPayload, MessageProcessor } from '@a2ui/angular';
import * as Types from '@a2ui/web_core/types/types';
import { Injectable, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Client {
  private processor = inject(MessageProcessor);

  readonly isLoading = signal(false);

  constructor() {
    this.processor.events.subscribe(async (event) => {
      try {
        const messages = await this.makeRequest(event.message);
        event.completion.next(messages);
        event.completion.complete();
      } catch (err) {
        event.completion.error(err);
      }
    });
  }

  async makeRequest(request: Types.A2UIClientEventMessage | string): Promise<Types.ServerToClientMessage[]> {
    let messages: Types.ServerToClientMessage[] = [];
    try {
      this.isLoading.set(true);
      // Clear surfaces at the start of a new request
      this.processor.clearSurfaces();

      const response = await fetch('/a2a', {
        body: JSON.stringify(request as Types.A2UIClientEventMessage),
        method: 'POST',
      });

      if (!response.ok) {
        const error = (await response.json()) as { error: string };
        throw new Error(error.error);
      }

      const contentType = response.headers.get('content-type');
      console.log(`[client] Received response with content-type: ${contentType}`);
      if (contentType?.includes('text/event-stream')) {
        await this.handleStreamingResponse(response, messages);
      } else {
        await this.handleNonStreamingResponse(response, messages);
      }
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
    return messages;
  }

  private async handleStreamingResponse(
    response: Response,
    messages: Types.ServerToClientMessage[]
  ): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
      let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const now = performance.now();
      buffer += decoder.decode(value, { stream: true });

      // Parse SSE events. The server sends "data: <json>\n\n"
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

      for (const line of lines) {
          if (line.startsWith("data: ")) {
          const jsonStr = line.slice(6);
          try {
            const data = JSON.parse(jsonStr) as A2AServerPayload;
            console.log(`[client] [${now.toFixed(2)}ms] Received SSE data:`, data);

            if ('error' in data) {
              throw new Error(data.error);
            } else {
              console.log(
                `[client] [${performance.now().toFixed(2)}ms] Scheduling processing for ${data.length} parts`
              );
              // Use a microtask to ensure we don't block the stream reader
              await Promise.resolve();
              const newMessages = this.processParts(data as any[]);
              messages.push(...newMessages);
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e, jsonStr);
          }
        }
      }
    }
  }

  private async handleNonStreamingResponse(
    response: Response,
    messages: Types.ServerToClientMessage[]
  ): Promise<void> {
    const data = (await response.json()) as any[];
    console.log(`[client] Received JSON response:`, data);
    const newMessages = this.processParts(data);
    messages.push(...newMessages);
  }

  private processParts(parts: any[]): Types.ServerToClientMessage[] {
    const messages: Types.ServerToClientMessage[] = [];
    for (const item of parts) {
      if (item.kind === 'text') continue;
      if (item.data) {
        messages.push(item.data);
      }
    }
    if (messages.length > 0) {
      this.processor.processMessages(messages);
    }
    return messages;
  }
}
