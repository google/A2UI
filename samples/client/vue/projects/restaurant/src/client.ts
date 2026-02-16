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

import * as Types from '@a2ui/web_core/types/types';
import type { A2AServerPayload } from '@a2ui/vue';
import { ref } from 'vue';
import { useMessageProcessor } from '@a2ui/vue';

const isLoading = ref(false);

export function useClient() {
  const processor = useMessageProcessor();

  // Subscribe to events from the processor
  processor.onEvent(async (event) => {
    try {
      const messages = await makeRequest(event.message);
      event.resolve(messages);
    } catch (err) {
      event.reject(err as Error);
    }
  });

  async function makeRequest(request: Types.A2UIClientEventMessage | string) {
    let messages: Types.ServerToClientMessage[];

    try {
      isLoading.value = true;
      const response = await send(request as Types.A2UIClientEventMessage);
      messages = response;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      isLoading.value = false;
    }

    processor.clearSurfaces();
    processor.processMessages(messages);
    return messages;
  }

  async function send(
    message: Types.A2UIClientEventMessage,
  ): Promise<Types.ServerToClientMessage[]> {
    const response = await fetch('/a2a', {
      body: JSON.stringify(message),
      method: 'POST',
    });

    if (response.ok) {
      const data = (await response.json()) as A2AServerPayload;
      const messages: Types.ServerToClientMessage[] = [];

      if ('error' in data) {
        throw new Error(data.error);
      } else {
        for (const item of data) {
          if (item.kind === 'text') continue;
          messages.push(item.data);
        }
      }
      return messages;
    }

    const error = (await response.json()) as { error: string };
    throw new Error(error.error);
  }

  return {
    isLoading,
    makeRequest,
    processor,
  };
}
