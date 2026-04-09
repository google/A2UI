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

import { v0_8 } from "@a2ui/lit";
import { registerContactComponents } from "./ui/custom-components/register-components.js";
type A2TextPayload = {
  kind: "text";
  text: string;
};

type A2DataPayload = {
  kind: "data";
  data: v0_8.Types.ServerToClientMessage;
};

type A2AServerPayload =
  | Array<A2DataPayload | A2TextPayload>
  | { error: string };

import { componentRegistry } from "@a2ui/lit/ui";

export class A2UIClient {
  #ready: Promise<void> = Promise.resolve();
  #contextId?: string;

  get ready() {
    return this.#ready;
  }

  async send(
    message: v0_8.Types.A2UIClientEventMessage
  ): Promise<v0_8.Types.ServerToClientMessage[]> {
    const catalog = componentRegistry.getInlineCatalog();
    const finalMessage = {
      ...message,
      metadata: {
        inlineCatalogs: [catalog],
      },
    };

    const response = await fetch("/a2a", {
      body: JSON.stringify({
        event: finalMessage,
        contextId: this.#contextId
      }),
      method: "POST",
    });

    if (response.ok) {
      const responseData = await response.json();
      if (responseData.contextId) {
        this.#contextId = responseData.contextId;
      }
      const parts = Array.isArray(responseData) ? responseData : (responseData.parts || []);
      const messages: v0_8.Types.ServerToClientMessage[] = [];
      if (responseData.error) {
        throw new Error(responseData.error);
      } else {
        const items = Array.isArray(parts) ? parts : [parts];
        for (const item of items) {
          if (item.kind === "text") continue;
          messages.push(item.data);
        }
      }
      return messages;
    }

    const error = (await response.json()) as { error: string };
    throw new Error(error.error);
  }
}
registerContactComponents();
