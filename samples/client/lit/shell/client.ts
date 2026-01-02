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

import { Part, SendMessageSuccessResponse } from "@a2a-js/sdk";
import { A2AClient } from "@a2a-js/sdk/client";
import { v0_8 } from "@a2ui/lit";

const A2AUI_MIME_TYPE = "application/json+a2aui";

export class A2UIClient {
  #serverUrl: string;
  #client: A2AClient | null = null;

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
      const baseUrl = this.#serverUrl || "http://localhost:10005";

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
            mimeType: A2AUI_MIME_TYPE,
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
        mimeType: A2AUI_MIME_TYPE,
      } as Part];
    }

    const response = await client.sendMessage({
      message: {
        messageId: crypto.randomUUID(),
        role: "user",
        parts: parts,
        kind: "message",
      },
    });

    if ("error" in response) {
      throw new Error(response.error.message);
    }

    const result = (response as SendMessageSuccessResponse).result as any;
    const messages: v0_8.Types.ServerToClientMessage[] = [];

    if (result.metadata?.a2a_subagent) {
      messages.push({
        a2a_subagent: result.metadata.a2a_subagent,
      } as any);
    }

    let responseParts = result.status?.message?.parts;

    if (!responseParts && result.history?.length > 0) {
      const lastMessage = result.history[result.history.length - 1];
      if (lastMessage.role === "agent") {
        responseParts = lastMessage.parts;
      }
    }

    if (responseParts) {
      for (const part of responseParts) {
        if (part.kind === 'data') {
          messages.push(part.data as v0_8.Types.ServerToClientMessage);
        }
      }
    }

    return messages;
  }
}
