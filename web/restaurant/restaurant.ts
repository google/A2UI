/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { SignalWatcher } from "@lit-labs/signals";
import { provide } from "@lit/context";
import { LitElement, html, css, nothing, HTMLTemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { themeContext } from "../src/0.8/ui/context/theme";
import { theme as uiTheme } from "./theme/theme.js";
import { A2UIProtocolMessage, Theme } from "../src/0.8/types/types";
import { A2UIClient } from "./client";
import { A2UIClientEventMessage } from "../src/0.8/types/client-event";
import * as Styles from "../src/0.8/ui/styles/index.js";
import {
  SnackbarAction,
  SnackbarMessage,
  SnackbarUUID,
  SnackType,
} from "./types/types";
import { type Snackbar } from "./ui/snackbar";
import { A2UIModelProcessor } from "../src/0.8/data/model-processor";
import { repeat } from "lit/directives/repeat.js";

// A2UI elements.
import "../src/0.8/ui/ui.js";

// Restaurant demo elements.
import "./ui/ui.js";
import { StateEvent } from "../src/0.8/events/events";

@customElement("a2ui-restaurant")
export class A2UILayoutEditor extends SignalWatcher(LitElement) {
  @provide({ context: themeContext })
  accessor theme: Theme = uiTheme;

  @state()
  accessor #requesting = false;

  @state()
  accessor #error: string | null = null;

  @state()
  accessor #lastMessages: A2UIProtocolMessage[] = [];

  static styles = [
    Styles.all,
    css`
      :host {
        display: block;
        max-width: 640px;
        margin: 0 auto;
        min-height: 100%;
      }

      #surfaces {
        width: 100%;
        padding: var(--bb-grid-size-3);
        animation: fadeIn 1s cubic-bezier(0, 0, 0.3, 1) 0.3s backwards;
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

      .rotate {
        animation: rotate 1s linear infinite;
      }

      .pending {
        width: 100%;
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 1s cubic-bezier(0, 0, 0.3, 1) 0.3s backwards;

        & .g-icon {
          margin-right: 8px;
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

  #processor = new A2UIModelProcessor();
  #a2uiClient = new A2UIClient();
  #snackbar: Snackbar | undefined = undefined;
  #pendingSnackbarMessages: Array<{
    message: SnackbarMessage;
    replaceAll: boolean;
  }> = [];

  render() {
    return [
      this.#maybeRenderForm(),
      this.#maybeRenderData(),
      this.#maybeRenderError(),
    ];
  }

  #maybeRenderError() {
    if (!this.#error) return nothing;

    return html`<div class="error">${this.#error}</div>`;
  }

  #maybeRenderForm() {
    if (this.#requesting) return nothing;
    if (this.#lastMessages.length > 0) return nothing;
    return html`<form
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
        const request = body as A2UIClientEventMessage;
        const messages = await this.#processRequest(request);

        this.#lastMessages = messages;
        console.debug(messages);
        this.#processor.clearSurfaces();
        this.#processor.processMessages(messages);
      }}
    >
      <h1 class="typography-f-sf typography-v-r typography-w-400 color-c-p30">
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
          ?disabled=${this.#requesting}
        />
        <button type="submit" ?disabled=${this.#requesting}>
          <span class="g-icon filled-heavy">send</span>
        </button>
      </div>
    </form>`;
  }

  #maybeRenderData() {
    if (this.#requesting) {
      return html` <div class="pending">
        <span class="g-icon filled-heavy rotate">progress_activity</span>
        Awaiting an answer...
      </div>`;
    }

    const surfaces = this.#processor.getSurfaces();
    if (surfaces.size === 0) {
      return nothing;
    }

    return html`<section id="surfaces">
      ${repeat(
        this.#processor.getSurfaces(),
        ([surfaceId]) => surfaceId,
        ([surfaceId, surface]) => {
          return html`<a2ui-surface
              @a2uiaction=${(evt: StateEvent<"a2ui.action">) => {
                const [target] = evt.composedPath();
                if (!(target instanceof HTMLElement)) {
                  return;
                }

                const context: A2UIClientEventMessage["userAction"]["context"] =
                  {};
                if (evt.detail.action.context) {
                  const srcContext = evt.detail.action.context;
                  for (const item of srcContext) {
                    if (item.value.literalBoolean) {
                      context[item.key] = item.value.literalBoolean;
                    } else if (item.value.literalNumber) {
                      context[item.key] = item.value.literalNumber;
                    } else if (item.value.literalString) {
                      context[item.key] = item.value.literalString;
                    } else if (item.value.path) {
                      const path = this.#processor.resolvePath(
                        item.value.path,
                        evt.detail.dataContextPath
                      );
                      const value = this.#processor.getDataByPath(
                        path,
                        surfaceId
                      );
                      context[item.key] = value;
                    }
                  }
                }

                const msg: A2UIClientEventMessage = {
                  userAction: {
                    actionName: evt.detail.action.action,
                    sourceComponentId: target.id,
                    timestamp: new Date().toISOString(),
                    context,
                  },
                };

                this.#processRequest(msg);
              }}
              .surfaceId=${surfaceId}
              .surface=${surface}
              .processor=${this.#processor}
            ></a2-uisurface>`;
        }
      )}
    </section>`;
  }

  async #processRequest(
    message: A2UIClientEventMessage
  ): Promise<A2UIProtocolMessage[]> {
    try {
      this.#requesting = true;
      const response = this.#a2uiClient.send(message);
      await response;
      this.#requesting = false;

      return response;
    } catch (err) {
      this.snackbar(err as string, SnackType.ERROR);
    } finally {
      this.#requesting = false;
    }

    return [];
  }

  snackbar(
    message: string | HTMLTemplateResult,
    type: SnackType,
    actions: SnackbarAction[] = [],
    persistent = false,
    id = globalThis.crypto.randomUUID(),
    replaceAll = false
  ) {
    if (!this.#snackbar) {
      this.#pendingSnackbarMessages.push({
        message: {
          id,
          message,
          type,
          persistent,
          actions,
        },
        replaceAll,
      });
      return;
    }

    return this.#snackbar.show(
      {
        id,
        message,
        type,
        persistent,
        actions,
      },
      replaceAll
    );
  }

  unsnackbar(id?: SnackbarUUID) {
    if (!this.#snackbar) {
      return;
    }

    this.#snackbar.hide(id);
  }
}
