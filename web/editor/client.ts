/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import DefaultCatalog from "../src/0.8/catalog/default-catalog.json";
import { A2UIClientEventMessage } from "../src/0.8/types/client-event";

export class A2UIClient {
  #ready: Promise<void> = Promise.resolve();
  constructor() {
    this.#handshake();
  }

  #handshake() {
    this.#ready = new Promise((resolve, reject) => {
      try {
        (async () => {
          await this.#send({
            clientUiCapabilities: {
              dynamicCatalog: DefaultCatalog,
            },
          });
          console.log("A2UI Client Handshake");
          resolve();
        })();
      } catch (err) {
        reject(err);
      }
    });
  }

  get ready() {
    return this.#ready;
  }

  async sendMultipart(imageData?: string, instructions?: string) {
    if (
      typeof instructions === "undefined" &&
      typeof imageData === "undefined"
    ) {
      throw new Error("No data provided");
    }

    return this.#send({
      request: {
        imageData,
        instructions,
      },
    });
  }

  async #send<T extends { role: "model"; parts: Array<{ text: string }> }>(
    message: A2UIClientEventMessage
  ) {
    const response = await fetch("/a2ui", {
      body: JSON.stringify(message),
      method: "POST",
    });
    if (response.ok) return response.json() as unknown as T;
    const error = (await response.json()) as { error: string };
    throw new Error(error.error);
  }
}
