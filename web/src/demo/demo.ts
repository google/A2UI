/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import "../0.7/ui/ui.js";
import { DataModel } from "../0.7/data/model.js";
import { LitElement, html, css, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { icons } from "../0.7/utils/icons.js";
import { StateEvent } from "../0.7/events/events.js";

import { theme as uiTheme } from "./theme/theme.js";
import { themeContext } from "../0.7/ui/context/theme.js";
import {
  BeginRenderingMessage,
  ComponentUpdateMessage,
  DataModelUpdateMessage,
  StreamHeaderMessage,
  Theme,
  UnifiedMessage,
} from "../0.7/types/types.js";
import { provide } from "@lit/context";
import * as Styles from "../0.7/ui/styles/index.js";
import { UnifiedMesssages } from "../0.7/types/types.js";
import {
  isBeginRendering,
  isComponentUpdate,
  isDataModelUpdate,
  isStreamHeader,
} from "../0.7/data/guards.js";

type A2AGULFMessages =
  | StreamHeaderMessage
  | {
      streamHeader: StreamHeaderMessage;
    }
  | DataModelUpdateMessage
  | { dataModelUpdate: DataModelUpdateMessage }
  | ComponentUpdateMessage
  | {
      componentUpdate: ComponentUpdateMessage;
    }
  | BeginRenderingMessage
  | { beginRendering: BeginRenderingMessage };

type A2TextPayload = {
  kind: "text";
  text: string;
};

type A2DataPayload = {
  kind: "data";
  data: A2AGULFMessages;
};

type A2AServerPayload =
  | Array<A2DataPayload | A2TextPayload>
  | { error: string };

@customElement("gulf-main")
export class GulfMain extends LitElement {
  @provide({ context: themeContext })
  accessor theme: Theme = uiTheme;

  static styles = [
    Styles.all,
    icons,
    css`
      * {
        box-sizing: border-box;
      }

      :host {
        display: flex;
        width: 100%;
        max-width: 640px;
        margin: 0 auto;
        min-height: 100%;
        font-family: var(--font-family);
        align-items: center;
        padding: 32px 0;
      }

      form {
        display: flex;
        flex-direction: column;
        flex: 1;
        gap: 16px;
        align-items: center;
        padding: 16px 0;
        animation: fadeIn 1s cubic-bezier(0, 0, 0.3, 1) 1s backwards;

        & > div {
          display: flex;
          flex: 1;
          gap: 16px;
          align-items: center;
          width: 100%;

          & > input {
            display: block;
            flex: 1;
            border-radius: 32px;
            padding: 16px 24px;
            border: 1px solid var(--p-60);
            font-size: 16px;
          }

          & > button {
            display: flex;
            align-items: center;
            background: var(--p-40);
            color: var(--n-100);
            border: none;
            padding: 8px 16px;
            border-radius: 32px;
            opacity: 0.5;

            &:not([disabled]) {
              cursor: pointer;
              opacity: 1;
            }
          }
        }
      }

      gulf-root {
        width: 100%;
        animation: fadeIn 1s cubic-bezier(0, 0, 0.3, 1) 0.3s backwards;
      }

      .rotate {
        animation: rotate 1s linear infinite;
      }

      .pending {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 1s cubic-bezier(0, 0, 0.3, 1) 0.3s backwards;

        & .g-icon {
          margin-right: 8px;
        }
      }

      details {
        font-size: 14px;

        & summary {
          list-style: none;
          cursor: pointer;

          &::-webkit-details-marker {
            display: none;
          }
        }
      }

      .error {
        color: var(--e-40);
        background-color: var(--e-95);
        border: 1px solid var(--e-80);
        padding: 16px;
        border-radius: 8px;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }

        to {
          opacity: 1;
        }
      }

      @keyframes rotate {
        from {
          rotate: 0deg;
        }

        to {
          rotate: 360deg;
        }
      }
    `,
  ];

  @state()
  accessor #data: {
    rawText?: string;
    model?: DataModel;
  } | null = null;

  @state()
  accessor #fetching = false;

  @state()
  accessor #error: string | null = null;

  #renderData() {
    if (!this.#data?.model?.current?.root) {
      return nothing;
    }

    return html`<gulf-root
      id=${this.#data.model.current.root.id}
      .model=${this.#data.model}
      .components=${[this.#data.model.current.root]}
      @gulfaction=${async (evt: StateEvent<"gulf.action">) => {
        if (!this.#data?.model || !evt.detail.action.context) {
          return;
        }

        const resolvedContext: Record<string, unknown> = {};
        for (const item of evt.detail.action.context) {
          if (item.value.path) {
            resolvedContext[item.key] = await this.#data.model.getDataProperty(
              item.value.path,
              evt.detail.dataPrefix
            );
          } else if (item.value.literalBoolean !== undefined) {
            resolvedContext[item.key] = item.value.literalBoolean;
          } else if (item.value.literalNumber !== undefined) {
            resolvedContext[item.key] = item.value.literalNumber;
          } else if (item.value.literalString !== undefined) {
            resolvedContext[item.key] = item.value.literalString;
          }
        }

        const message = {
          actionName: evt.detail.action.action,
          sourceComponentId: evt.detail.sourceComponentId,
          timestamp: new Date().toISOString(),
          resolvedContext: resolvedContext,
        };

        this.#sendToRemote(JSON.stringify(message), {
          headers: { "Content-Type": "application/json" },
          isNewQuery: false,
        });
      }}
    ></gulf-root>`;
  }

  #unwrapDataIfNeeded(payload: A2DataPayload): UnifiedMessage {
    console.log(payload);
    if (
      isStreamHeader(payload.data) ||
      isComponentUpdate(payload.data) ||
      isDataModelUpdate(payload.data) ||
      isBeginRendering(payload.data)
    ) {
      console.log("Return data as-is");
      return payload.data;
    } else if ("streamHeader" in payload.data) {
      return payload.data.streamHeader as StreamHeaderMessage;
    } else if ("componentUpdate" in payload.data) {
      return payload.data.componentUpdate as ComponentUpdateMessage;
    } else if ("dataModelUpdate" in payload.data) {
      return payload.data.dataModelUpdate as DataModelUpdateMessage;
    } else if ("beginRendering" in payload.data) {
      return payload.data.beginRendering as BeginRenderingMessage;
    }

    throw new Error("Unexpected data payload");
  }

  async #sendToRemote(
    body: BodyInit,
    options: { headers?: HeadersInit; isNewQuery?: boolean } = {}
  ) {
    const { headers = {}, isNewQuery = true } = options;

    this.#fetching = true;
    this.#error = null;

    if (isNewQuery) {
      this.#data = null;
    }

    try {
      const response = await fetch("/a2a", {
        method: "POST",
        body,
        headers,
      });

      const items = (await response.json()) as A2AServerPayload;
      if (!response.ok && "error" in items) {
        throw new Error(items.error || "An unknown error occurred");
      }

      console.log(items);

      if (Array.isArray(items)) {
        const gulfMessages: UnifiedMesssages = [];

        for (const item of items) {
          if (item.kind === "text") {
            this.#data = this.#data ?? {};
            this.#data.rawText = (this.#data.rawText || "") + item.text;
          } else if (item.kind === "data" && item.data) {
            gulfMessages.push(this.#unwrapDataIfNeeded(item));
          }
        }

        if (gulfMessages.length > 0) {
          let model = this.#data?.model;
          if (isNewQuery || !model) {
            model = new DataModel();
            // Preserve rawText on model creation if it's not a new query.
            const existingRawText = isNewQuery
              ? undefined
              : this.#data?.rawText;
            this.#data = { model, rawText: existingRawText };
          }

          await model.append(gulfMessages);
        }
      } else {
        this.#error = "Unable to retrieve: Response is not an array.";
      }
    } catch (err) {
      console.error(err);
      this.#error =
        err instanceof Error ? err.message : "Unable to handle response.";
    } finally {
      this.#fetching = false;
    }
  }

  render() {
    return [
      this.#data || this.#fetching
        ? nothing
        : html`<form
            @submit=${async (evt: Event) => {
              evt.preventDefault();
              if (!(evt.target instanceof HTMLFormElement)) {
                return;
              }

              const data = new FormData(evt.target);
              const body = data.get("body") ?? null;
              if (!body) {
                return;
              }

              this.#sendToRemote(body, { isNewQuery: true });
            }}
          >
            <h1
              class="typography-f-sf typography-v-r typography-w-400 color-c-p30"
            >
              Restaurant Finder
            </h1>
            <div>
              <input
                required
                value="Top 5 Chinese restaurants in New York."
                autocomplete="off"
                id="body"
                name="body"
                type="text"
                ?disabled=${this.#fetching}
              />
              <button type="submit" ?disabled=${this.#fetching}>
                <span class="g-icon filled-heavy">send</span>
              </button>
            </div>
          </form>`,
      this.#fetching
        ? html` <div class="pending">
            <span class="g-icon filled-heavy rotate">progress_activity</span>
            Awaiting an answer...
          </div>`
        : this.#data
          ? this.#renderData()
          : nothing,
      this.#error ? html`<div class="error">${this.#error}</div>` : nothing,
    ];
  }
}

const main = new GulfMain();
document.body.appendChild(main);
