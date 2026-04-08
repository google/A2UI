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

import { Part, SendMessageSuccessResponse, Task } from "@a2a-js/sdk";
import { A2AClient } from "@a2a-js/sdk/client";
import { v0_8 } from "@a2ui/lit";

const A2UI_MIME_TYPE = "application/json+a2ui";
const TEXT_FALLBACK_SURFACE_ID = "@default";
const TEXT_FALLBACK_ROOT_ID = "__a2ui_text_fallback_root";

function textFallbackComponentId(index: number) {
  return `__a2ui_text_fallback_${index}`;
}

export function convertA2APartsToMessages(
  parts: Part[]
): v0_8.Types.ServerToClientMessage[] {
  const dataMessages: v0_8.Types.ServerToClientMessage[] = [];
  const textMessages: string[] = [];

  for (const part of parts) {
    if (part.kind === "data") {
      dataMessages.push(part.data as v0_8.Types.ServerToClientMessage);
      continue;
    }

    if (part.kind === "text" && part.text.trim().length > 0) {
      textMessages.push(part.text);
    }
  }

  if (dataMessages.length > 0 || textMessages.length === 0) {
    return dataMessages;
  }

  if (textMessages.length === 1) {
    const rootId = textFallbackComponentId(0);
    return [
      {
        beginRendering: {
          root: rootId,
          surfaceId: TEXT_FALLBACK_SURFACE_ID,
        },
      },
      {
        surfaceUpdate: {
          surfaceId: TEXT_FALLBACK_SURFACE_ID,
          components: [
            {
              id: rootId,
              component: {
                Text: {
                  usageHint: "body" as const,
                  text: { literalString: textMessages[0] },
                },
              },
            },
          ],
        },
      },
    ];
  }

  const childIds = textMessages.map((_, index) => textFallbackComponentId(index));

  return [
    {
      beginRendering: {
        root: TEXT_FALLBACK_ROOT_ID,
        surfaceId: TEXT_FALLBACK_SURFACE_ID,
      },
    },
    {
      surfaceUpdate: {
        surfaceId: TEXT_FALLBACK_SURFACE_ID,
        components: [
          {
            id: TEXT_FALLBACK_ROOT_ID,
            component: {
              Column: {
                children: {
                  explicitList: childIds,
                },
              },
            },
          },
          ...textMessages.map((text, index) => ({
            id: childIds[index],
            component: {
              Text: {
                usageHint: "body" as const,
                text: { literalString: text },
              },
            },
          })),
        ],
      },
    },
  ];
}

export class A2UIClient {
  #serverUrl: string;
  #client: A2AClient | null = null;
  #contextId?: string;

  constructor(serverUrl: string = "") {
    this.#serverUrl = serverUrl;
  }

  #ready: Promise<void> = Promise.resolve();
  get ready() {
    return this.#ready;
  }

  async #getClient() {
    if (!this.#client) {
      // Default to localhost:10002 if no URL provided (fallback for restaurant app default)
      const baseUrl = this.#serverUrl || "http://localhost:10002";

      this.#client = await A2AClient.fromCardUrl(
        `${baseUrl}/.well-known/agent-card.json`,
        {
          fetchImpl: async (url, init) => {
            const headers = new Headers(init?.headers);
            headers.set("X-A2A-Extensions", "https://a2ui.org/a2a-extension/a2ui/v0.8");
            return fetch(url, { ...init, headers });
          }
        }
      );
    }
    return this.#client;
  }

  async send(
    message: v0_8.Types.A2UIClientEventMessage | string
  ): Promise<v0_8.Types.ServerToClientMessage[]> {
    const client = await this.#getClient();

    let parts: Part[] = [];

    if (typeof message === 'string') {
      // Try to parse as JSON first, just in case
      try {
        const parsed = JSON.parse(message);
        if (typeof parsed === 'object' && parsed !== null) {
          parts = [{
            kind: "data",
            data: parsed as unknown as Record<string, unknown>,
            mimeType: A2UI_MIME_TYPE,
          } as Part];
        } else {
          parts = [{ kind: "text", text: message }];
        }
      } catch {
        parts = [{ kind: "text", text: message }];
      }
    } else {
      parts = [{
        kind: "data",
        data: message as unknown as Record<string, unknown>,
        mimeType: A2UI_MIME_TYPE,
      } as Part];
    }

    const response = await client.sendMessage({
      message: {
        messageId: crypto.randomUUID(),
        contextId: this.#contextId,
        role: "user",
        parts: parts,
        kind: "message",
      },
    });

    if ("error" in response) {
      throw new Error(response.error.message);
    }

    const result = (response as SendMessageSuccessResponse).result as Task;
    
    // Extract contextId
    if (result.contextId) {
      this.#contextId = result.contextId;
    } else if ("contextId" in response && response.contextId) {
      this.#contextId = response.contextId as string;
    }

    if (result.kind === "task" && result.status.message?.parts) {
      return convertA2APartsToMessages(result.status.message.parts);
    }

    return [];
  }
}
