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

import { Part, SendMessageSuccessResponse, Task } from "@a2a-js/sdk";
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

    const result = (response as SendMessageSuccessResponse).result as Task;
    console.debug("Full Server Response Result:", JSON.stringify(result, null, 2));

    let responseParts = result.status.message?.parts;

    // Fallback: If no parts in status.message, check the last agent message in history
    if (!responseParts && result.history && result.history.length > 0) {
      // Iterate backwards to find the last agent message
      for (let i = result.history.length - 1; i >= 0; i--) {
        const msg = result.history[i];
        if (msg.role === 'agent' && msg.parts && msg.parts.length > 0) {
          responseParts = msg.parts;
          console.debug("Found parts in history at index", i);
          break;
        }
      }
    }

    if (result.kind === "task" && responseParts) {
      const messages: v0_8.Types.ServerToClientMessage[] = [];
      for (const part of responseParts) {
        console.debug("Client Received part:", JSON.stringify(part, null, 2));

        if (part.kind === 'data') {
          let data = part.data;
          // Handle string-encoded JSON data parts
          if (typeof data === 'string') {
            try {
              data = JSON.parse(data);
              console.debug("Parsed string data:", data);
            } catch (e) {
              console.error("Failed to parse part.data string:", e);
            }
          }
          messages.push(data as v0_8.Types.ServerToClientMessage);
        } else if (part.kind === 'text') {
          console.debug("Ignored text part:", part.text);
        }
      }
      console.debug("Final messages to process:", messages);
      return messages;
    }

    return [];
  }
}
