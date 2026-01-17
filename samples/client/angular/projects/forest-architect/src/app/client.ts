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

import { A2AServerPayload, MessageProcessor } from '@a2ui/angular';
import { Types } from '@a2ui/lit/0.8';
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

    async makeRequest(request: Types.A2UIClientEventMessage | string) {
        let messages: Types.ServerToClientMessage[];

        try {
            this.isLoading.set(true);
            const response = await this.send(request as Types.A2UIClientEventMessage);
            messages = response;
        } catch (err) {
            console.error(err);
            throw err;
        } finally {
            this.isLoading.set(false);
        }

        this.processor.clearSurfaces();
        this.processor.processMessages(messages);
        return messages;
    }

    async send(message: Types.A2UIClientEventMessage): Promise<Types.ServerToClientMessage[]> {
        const response = await fetch('/a2a', {
            body: JSON.stringify(message),
            method: 'POST',
        });

        if (response.ok) {
            const data = (await response.json()) as A2AServerPayload;
            console.log('[client] Raw A2A response:', JSON.stringify(data, null, 2));
            const messages: Types.ServerToClientMessage[] = [];

            if ('error' in data) {
                throw new Error(data.error);
            } else {
                for (const item of data) {
                    console.log('[client] Processing part:', item);
                    if (item.kind === 'text') {
                        console.log('[client] Skipping text part');
                        continue;
                    }
                    // Handle data parts - the A2UI messages are in item.data
                    if (item.kind === 'data' && item.data) {
                        console.log('[client] Found data part:', item.data);
                        messages.push(item.data);
                    }
                }
            }
            console.log('[client] Final messages to process:', messages.length);
            return messages;
        }

        const error = (await response.json()) as { error: string };
        throw new Error(error.error);
    }
}
