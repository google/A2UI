import { Part, SendMessageSuccessResponse, Task } from '@a2a-js/sdk';
import { A2AClient } from '@a2a-js/sdk/client';
import type { Types } from '@a2ui/react';

const A2UI_MIME_TYPE = 'application/json+a2ui';

export class A2UIClient {
  #serverUrl: string;
  #client: A2AClient | null = null;

  constructor(serverUrl: string = '') {
    this.#serverUrl = serverUrl;
  }

  #ready: Promise<void> = Promise.resolve();
  get ready() {
    return this.#ready;
  }

  async #getClient() {
    if (!this.#client) {
      // Default to localhost:10002 if no URL provided (fallback for restaurant app default)
      const baseUrl = this.#serverUrl || 'http://localhost:10002';

      this.#client = await A2AClient.fromCardUrl(
        `${baseUrl}/.well-known/agent-card.json`,
        {
          fetchImpl: async (url, init) => {
            const headers = new Headers(init?.headers);
            headers.set(
              'X-A2A-Extensions',
              'https://a2ui.org/a2a-extension/a2ui/v0.8'
            );
            return fetch(url, { ...init, headers });
          },
        }
      );
    }
    return this.#client;
  }

  async send(
    message: Types.A2UIClientEventMessage | string
  ): Promise<Types.ServerToClientMessage[]> {
    const client = await this.#getClient();

    let parts: Part[] = [];

    if (typeof message === 'string') {
      // Try to parse as JSON first, just in case
      try {
        const parsed = JSON.parse(message);
        if (typeof parsed === 'object' && parsed !== null) {
          parts = [
            {
              kind: 'data',
              data: parsed as unknown as Record<string, unknown>,
              mimeType: A2UI_MIME_TYPE,
            } as Part,
          ];
        } else {
          parts = [{ kind: 'text', text: message }];
        }
      } catch {
        parts = [{ kind: 'text', text: message }];
      }
    } else {
      parts = [
        {
          kind: 'data',
          data: message as unknown as Record<string, unknown>,
          mimeType: A2UI_MIME_TYPE,
        } as Part,
      ];
    }

    const response = await client.sendMessage({
      message: {
        messageId: crypto.randomUUID(),
        role: 'user',
        parts: parts,
        kind: 'message',
      },
    });

    if ('error' in response) {
      throw new Error(response.error.message);
    }

    const result = (response as SendMessageSuccessResponse).result as Task;
    if (result.kind === 'task' && result.status.message?.parts) {
      const messages: Types.ServerToClientMessage[] = [];
      for (const part of result.status.message.parts) {
        if (part.kind === 'data') {
          messages.push(part.data as Types.ServerToClientMessage);
        }
      }
      return messages;
    }

    return [];
  }
}
