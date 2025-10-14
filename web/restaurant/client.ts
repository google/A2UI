/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
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
