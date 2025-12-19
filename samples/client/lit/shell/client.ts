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
    const messages: v0_8.Types.ServerToClientMessage[] = [];
    
    console.log("A2A Response:", JSON.stringify(result, null, 2));
    
    // Check for parts in the task status message (streaming/task-based responses)
    if (result.kind === "task" && result.status?.message?.parts) {
      console.log("Found parts in task status message");
      for (const part of result.status.message.parts) {
        if (part.kind === 'data') {
          messages.push(part.data as v0_8.Types.ServerToClientMessage);
        }
      }
      if (messages.length > 0) return messages;
    }
    
    // Check for parts in artifacts (blocking responses)
    if (result.artifacts && result.artifacts.length > 0) {
      console.log("Found artifacts:", result.artifacts.length);
      for (const artifact of result.artifacts) {
        if (artifact.parts) {
          for (const part of artifact.parts) {
            console.log("Artifact part kind:", part.kind);
            if (part.kind === 'data') {
              messages.push(part.data as v0_8.Types.ServerToClientMessage);
            }
          }
        }
      }
      if (messages.length > 0) return messages;
    }
    
    // Check for parts in the last history message (agent response)
    if (result.history && result.history.length > 0) {
      console.log("Found history:", result.history.length);
      const lastMessage = result.history[result.history.length - 1];
      console.log("Last message role:", lastMessage.role);
      if (lastMessage.role === 'agent' && lastMessage.parts) {
        for (const part of lastMessage.parts) {
          console.log("History part kind:", part.kind);
          if (part.kind === 'data') {
            messages.push(part.data as v0_8.Types.ServerToClientMessage);
          }
        }
      }
    }

    console.log("Total messages found:", messages.length);
    return messages;
  }
}
