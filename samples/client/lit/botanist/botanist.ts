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

import { SignalWatcher } from "@lit-labs/signals";
import { provide } from "@lit/context";
import {
  LitElement,
  html,
  css,
  nothing,
  unsafeCSS,
} from "lit";
import { customElement, state } from "lit/decorators.js";
import { theme as uiTheme } from "./theme/theme.js";
import { A2UIClient } from "./client.js";
import { repeat } from "lit/directives/repeat.js";
import { v0_8 } from "@a2ui/lit";
import * as UI from "@a2ui/lit/ui";

// Import UI components
import "./ui/ui.js";
import { registerBotanistComponents } from "./ui/custom-components/register-components.js";

// Register custom botanist components
registerBotanistComponents();

@customElement("a2ui-botanist")
export class A2UIBotanist extends SignalWatcher(LitElement) {
  @provide({ context: UI.Context.themeContext })
  accessor theme: v0_8.Types.Theme = uiTheme;

  @state()
  accessor _requesting = false;

  @state()
  accessor _error: string | null = null;

  @state()
  accessor _lastMessages: v0_8.Types.ServerToClientMessage[] = [];

  @state()
  accessor _searchQuery = "";

  private _processor = v0_8.Data.createSignalA2uiMessageProcessor();
  private _a2uiClient = new A2UIClient();

  static styles = [
    unsafeCSS(v0_8.Styles.structuralStyles),
    css`
      :host {
        display: block;
        max-width: 800px;
        margin: 0 auto;
        min-height: 100%;
        padding: 0 16px;
      }

      .header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 24px 0 16px;
        border-bottom: 1px solid var(--p-90);
        margin-bottom: 16px;

        & .logo {
          font-size: 48px;
        }

        & h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          color: var(--p-30);
        }

        & .subtitle {
          margin: 0;
          font-size: 14px;
          color: var(--p-40);
        }
      }

      #surfaces {
        display: flex;
        flex-direction: column;
        width: 100%;
        padding: var(--bb-grid-size-3) 0;
        animation: fadeIn 0.5s cubic-bezier(0, 0, 0.3, 1) 0.1s backwards;

        & a2ui-surface {
          align-items: center;
        }
      }

      .search-section {
        animation: fadeIn 0.5s cubic-bezier(0, 0, 0.3, 1) 0.2s backwards;
      }

      form {
        display: flex;
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
        padding: 16px 0;

        & .search-row {
          display: flex;
          gap: 12px;
          align-items: center;

          & > input {
            flex: 1;
            border-radius: 28px;
            padding: 14px 24px;
            border: 2px solid var(--p-70);
            font-size: 16px;
            font-family: inherit;
            background: white;
            transition: border-color 0.2s, box-shadow 0.2s;

            &:focus {
              outline: none;
              border-color: var(--p-40);
              box-shadow: 0 0 0 4px rgba(46, 125, 50, 0.15);
            }

            &::placeholder {
              color: var(--p-50);
            }
          }

          & > button {
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--p-30);
            color: white;
            border: none;
            padding: 14px 24px;
            border-radius: 28px;
            font-weight: 600;
            gap: 8px;
            cursor: pointer;
            transition: background 0.2s, transform 0.1s;

            &:hover:not([disabled]) {
              background: var(--p-25);
            }

            &:active:not([disabled]) {
              transform: scale(0.98);
            }

            &[disabled] {
              opacity: 0.5;
              cursor: not-allowed;
            }
          }
        }

        & .quick-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;

          & button {
            padding: 8px 16px;
            border-radius: 20px;
            border: 1px solid var(--p-60);
            background: white;
            color: var(--p-30);
            font-size: 13px;
            font-family: inherit;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 6px;

            &:hover {
              background: var(--p-95);
              border-color: var(--p-40);
            }

            & .g-icon {
              font-size: 16px;
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
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        animation: fadeIn 0.3s ease-out;
        color: var(--p-40);

        & .g-icon {
          font-size: 32px;
          color: var(--p-50);
        }
      }

      .error {
        color: var(--e-40);
        background-color: var(--e-90);
        border: 1px solid var(--e-80);
        padding: 16px;
        border-radius: 12px;
        margin: 16px 0;
      }

      .back-button {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        margin-bottom: 16px;
        border-radius: 20px;
        border: 1px solid var(--p-60);
        background: white;
        color: var(--p-30);
        font-size: 14px;
        font-family: inherit;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: var(--p-95);
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
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

      /* A2UI Card Styling */
      a2ui-card {
        display: block;
        background: white;
        border-radius: 16px;
        box-shadow: 0 4px 12px rgba(46, 125, 50, 0.15);
        overflow: hidden;
        margin-bottom: 16px;
        transition: transform 0.2s, box-shadow 0.2s;
      }

      a2ui-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(46, 125, 50, 0.2);
      }

      /* A2UI Row inside Card - make it a proper card layout */
      a2ui-card a2ui-row {
        display: grid;
        grid-template-columns: 150px 1fr auto;
        gap: 16px;
        align-items: center;
        padding: 12px;
      }

      /* A2UI Image inside Card */
      a2ui-card a2ui-image {
        width: 150px;
        height: 120px;
        border-radius: 12px;
        overflow: hidden;
        flex-shrink: 0;
      }

      a2ui-card a2ui-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      /* A2UI Column inside Card - details section */
      a2ui-card a2ui-column {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
      }

      /* Text styling in cards */
      a2ui-card a2ui-text {
        display: block;
      }

      a2ui-card a2ui-text[usagehint="h3"],
      a2ui-card a2ui-text:first-child {
        font-weight: 600;
        color: #1b5e20;
        font-size: 16px;
      }

      a2ui-card a2ui-text[style*="italic"] {
        font-style: italic;
        color: #558b2f;
        font-size: 14px;
      }

      /* A2UI Button styling */
      a2ui-card a2ui-button {
        flex-shrink: 0;
      }

      a2ui-card a2ui-button button {
        background: var(--p-30, #2e7d32);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }

      a2ui-card a2ui-button button:hover {
        background: var(--p-20, #1b5e20);
      }

      /* A2UI List styling */
      a2ui-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
    `,
  ];

  render() {
    return [
      this._renderHeader(),
      this._maybeRenderBackButton(),
      this._maybeRenderForm(),
      this._maybeRenderData(),
      this._maybeRenderError(),
    ];
  }

  private _renderHeader() {
    return html`
      <header class="header">
        <span class="logo">🌱</span>
        <div>
          <h1>Digital Botanist</h1>
          <p class="subtitle">Your AI plant expert from Heartyculture</p>
        </div>
      </header>
    `;
  }

  private _maybeRenderBackButton() {
    if (this._lastMessages.length === 0) return nothing;
    if (this._requesting) return nothing;

    return html`
      <button class="back-button" @click=${this._handleReset}>
        <span class="g-icon">arrow_back</span>
        New Search
      </button>
    `;
  }

  private _handleReset() {
    this._lastMessages = [];
    this._processor.clearSurfaces();
    this._searchQuery = "";
  }

  private _maybeRenderError() {
    if (!this._error) return nothing;
    return html`<div class="error">${this._error}</div>`;
  }

  private _maybeRenderForm() {
    if (this._requesting) return nothing;
    if (this._lastMessages.length > 0) return nothing;

    return html`
      <section class="search-section">
        <form @submit=${this._handleSubmit}>
          <div class="search-row">
            <input
              required
              value=${this._searchQuery}
              autocomplete="off"
              id="body"
              name="body"
              type="text"
              placeholder="Ask me about plants... e.g., 'Air purifying plants for my bedroom'"
              ?disabled=${this._requesting}
              @input=${(e: InputEvent) => {
        this._searchQuery = (e.target as HTMLInputElement).value;
      }}
            />
            <button type="submit" ?disabled=${this._requesting}>
              <span class="g-icon filled-heavy">search</span>
              Search
            </button>
          </div>
          <div class="quick-actions">
            <button type="button" @click=${() => this._quickSearch("Show me flowering shrubs")}>
              <span class="g-icon">local_florist</span>
              Flowering Shrubs
            </button>
            <button type="button" @click=${() => this._quickSearch("What palm varieties do you have?")}>
              <span class="g-icon">park</span>
              Palm Varieties
            </button>
            <button type="button" @click=${() => this._quickSearch("Show plant categories")}>
              <span class="g-icon">folder</span>
              Browse Categories
            </button>
            <button type="button" @click=${() => this._quickSearch("Plants that attract birds")}>
              <span class="g-icon">yard</span>
              Bird-Friendly
            </button>
          </div>
        </form>
      </section>
    `;
  }

  private async _quickSearch(query: string) {
    this._searchQuery = query;
    await this._sendAndProcessMessage(query);
  }

  private async _handleSubmit(evt: Event) {
    evt.preventDefault();
    if (!(evt.target instanceof HTMLFormElement)) return;

    const data = new FormData(evt.target);
    const body = data.get("body") as string;
    if (!body) return;

    await this._sendAndProcessMessage(body);
  }

  private _maybeRenderData() {
    if (this._requesting) {
      return html`
        <div class="pending">
          <span class="g-icon filled-heavy rotate">progress_activity</span>
          <span>Searching the plant database...</span>
        </div>
      `;
    }

    const surfaces = this._processor.getSurfaces();
    if (surfaces.size === 0) {
      return nothing;
    }

    return html`
      <section id="surfaces">
        ${repeat(
      this._processor.getSurfaces(),
      ([surfaceId]) => surfaceId,
      ([surfaceId, surface]) => {
        return html`
              <a2ui-surface
                @a2uiaction=${async (evt: v0_8.Events.StateEvent<"a2ui.action">) => {
            const [target] = evt.composedPath();
            if (!(target instanceof HTMLElement)) return;

            const context: Record<string, unknown> = {};
            if (evt.detail.action && (evt.detail.action as any).context && evt.detail.sourceComponent) {
              for (const item of (evt.detail.action as any).context) {
                if (item.value.literalBoolean !== undefined) {
                  context[item.key] = item.value.literalBoolean;
                } else if (item.value.literalNumber !== undefined) {
                  context[item.key] = item.value.literalNumber;
                } else if (item.value.literalString !== undefined) {
                  context[item.key] = item.value.literalString;
                } else if (item.value.path) {
                  const path = this._processor.resolvePath(
                    item.value.path,
                    evt.detail.dataContextPath
                  );
                  const value = this._processor.getData(
                    evt.detail.sourceComponent,
                    path,
                    surfaceId
                  );
                  context[item.key] = value;
                }
              }
            }

            const message: v0_8.Types.A2UIClientEventMessage = {
              userAction: {
                surfaceId: surfaceId,
                name: evt.detail.action.name,
                sourceComponentId: target.id,
                timestamp: new Date().toISOString(),
                context,
              },
            };

            await this._sendAndProcessMessage(message);
          }}
                .surfaceId=${surfaceId}
                .surface=${surface}
                .processor=${this._processor}
              ></a2ui-surface>
            `;
      }
    )}
      </section>
    `;
  }

  private async _sendAndProcessMessage(request: string | v0_8.Types.A2UIClientEventMessage) {
    const messages = await this._sendMessage(request);
    this._lastMessages = messages;
    this._processor.clearSurfaces();
    this._processor.processMessages(messages);
  }

  private async _sendMessage(
    message: string | v0_8.Types.A2UIClientEventMessage
  ): Promise<v0_8.Types.ServerToClientMessage[]> {
    try {
      this._requesting = true;
      this._error = null;
      const response = await this._a2uiClient.send(message);
      return response;
    } catch (err) {
      this._error = `Error: ${err}`;
      return [];
    } finally {
      this._requesting = false;
    }
  }
}
