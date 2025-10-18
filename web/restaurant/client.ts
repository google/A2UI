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

import { A2UIClientEventMessage } from "../src/0.8/types/client-event";
import { A2UIProtocolMessage } from "../src/0.8/types/types";

type A2TextPayload = {
  kind: "text";
  text: string;
};

type A2DataPayload = {
  kind: "data";
  data: A2UIProtocolMessage;
};

type A2AServerPayload =
  | Array<A2DataPayload | A2TextPayload>
  | { error: string };

export class A2UIClient {
  #ready: Promise<void> = Promise.resolve();
  get ready() {
    return this.#ready;
  }

  async send(message: A2UIClientEventMessage): Promise<A2UIProtocolMessage[]> {
    const response = await fetch("/a2a", {
      body: JSON.stringify(message),
      method: "POST",
    });

    if (response.ok) {
      const data = (await response.json()) as A2AServerPayload;
      const messages: A2UIProtocolMessage[] = [];
      if ("error" in data) {
        throw new Error(data.error);
      } else {
        for (const item of data) {
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
