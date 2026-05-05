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

import {SignalWatcher} from '@lit-labs/signals';
import {provide} from '@lit/context';
import {LitElement, html, css, nothing} from 'lit';
import {customElement, state, query} from 'lit/decorators.js';
import {
  SnackbarAction,
  SnackbarMessage,
  SnackbarUUID,
  SnackType,
} from '../custom-components-example/types/types.js';
import {type Snackbar} from '../custom-components-example/ui/snackbar.js';
import {repeat} from 'lit/directives/repeat.js';

// A2UI
import * as v0_9 from '@a2ui/web_core/v0_9';
import {basicCatalog, Context} from '@a2ui/lit/v0_9';
import {renderMarkdown} from '@a2ui/markdown-it';

// Configurations
import {A2UIClient} from './client.js';
import {restaurantConfig, AppConfig} from './configs/configs.js';
import {styleMap} from 'lit/directives/style-map.js';

const configs: Record<string, AppConfig> = {
  restaurant: restaurantConfig,
};

@customElement('a2ui-shell')
export class A2UILayoutEditor extends SignalWatcher(LitElement) {
  @provide({context: Context.markdown})
  accessor markdownRenderer: any = renderMarkdown;

  @state()
  accessor #requesting = false;

  @state()
  accessor #lastMessages: any[] = [];

  @state()
  accessor config: AppConfig = restaurantConfig;

  @state()
  accessor #loadingTextIndex = 0;
  #loadingInterval: number | undefined;

  static styles = [
    css`
      * {
        box-sizing: border-box;
      }

      :host {
        display: block;
        max-width: 640px;
        margin: 0 auto;
        min-height: 100%;
        color: light-dark(var(--n-10), var(--n-90));
        font-family: var(--font-family);
      }

      #hero-img {
        width: 100%;
        max-width: 400px;
        aspect-ratio: 1280/720;
        height: auto;
        margin-bottom: var(--bb-grid-size-6);
        display: block;
        margin: 0 auto;
        background: var(--background-image-light) center center / contain no-repeat;
      }

      #surfaces {
        width: 100%;
        max-width: 100svw;
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

        & h1 {
          color: light-dark(var(--p-40), var(--n-90));
        }

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
            background: light-dark(var(--n-100), var(--n-10));
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

      .material-symbols {
        font-family: 'Material Symbols Outlined', sans-serif;
        font-variation-settings: 'FILL' 1;
        font-weight: normal;
        font-style: normal;
        font-size: 24px;
        line-height: 1;
        letter-spacing: normal;
        text-transform: none;
        display: inline-block;
        white-space: nowrap;
        word-wrap: normal;
        direction: ltr;
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
        animation: fadeIn 1s cubic-bezier(0, 0, 0.3, 1) 0.3s backwards;
        gap: 16px;
      }

      .spinner {
        width: 48px;
        height: 48px;
        border: 4px solid rgba(255, 255, 255, 0.1);
        border-left-color: var(--p-60);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      .theme-toggle {
        padding: 0;
        margin: 0;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        position: fixed;
        top: var(--bb-grid-size-3);
        right: var(--bb-grid-size-4);
        background: light-dark(var(--n-100), var(--n-0));
        border-radius: 50%;
        color: var(--p-30);
        cursor: pointer;
        width: 48px;
        height: 48px;
        font-size: 32px;

        & .material-symbols {
          font-family: 'Material Symbols Outlined';
          pointer-events: none;

          &::before {
            content: 'dark_mode';
          }
        }
      }

      @container style(--color-scheme: dark) {
        .theme-toggle .material-symbols::before {
          content: 'light_mode';
          color: var(--n-90);
        }

        #hero-img {
          background-image: var(--background-image-dark);
        }
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes pulse {
        0% {
          opacity: 0.6;
        }
        50% {
          opacity: 1;
        }
        100% {
          opacity: 0.6;
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

  // Create a Message Processor that uses the basic catalog.
  #processor = new v0_9.MessageProcessor(
    [basicCatalog],
    async (action: v0_9.A2uiClientAction): Promise<any> => {
      console.debug('Handling action', action);

      const context: Record<string, any> = {...action.context};

      // Do we need to update this to a more strict v0.9 type?
      const message = {
        userAction: {
          name: action.name,
          surfaceId: action.surfaceId,
          sourceComponentId: action.sourceComponentId,
          timestamp: new Date().toISOString(),
          context,
        },
      };

      await this.#sendAndProcessMessage(message);
    },
  );
  #a2uiClient = new A2UIClient();
  @query('ui-snackbar')
  accessor #snackbar!: Snackbar;

  #pendingSnackbarMessages: Array<{
    message: SnackbarMessage;
    replaceAll: boolean;
  }> = [];

  #error: string | undefined;

  #maybeRenderError() {
    if (!this.#error) return nothing;

    return html`<div class="error">${this.#error}</div>`;
  }

  connectedCallback() {
    super.connectedCallback();

    // Load config from URL
    const urlParams = new URLSearchParams(window.location.search);
    const appKey = urlParams.get('app');
    if (appKey && !configs[appKey]) {
      this.#pendingSnackbarMessages.push({
        message: {
          id: crypto.randomUUID(),
          message: `App "${appKey}" is not available. Falling back to Restaurant Finder.`,
          type: SnackType.WARNING,
          persistent: false,
        },
        replaceAll: false,
      });
    }
    this.config = (appKey && configs[appKey]) || restaurantConfig;

    // Set the CSS Overrides for the given appKey.
    if (
      this.config.cssOverrides &&
      !document.adoptedStyleSheets.includes(this.config.cssOverrides)
    ) {
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, this.config.cssOverrides];
    }
    document.title = this.config.title;

    // Initialize client with configured URL
    this.#a2uiClient = new A2UIClient(this.config.serverUrl);
  }

  protected firstUpdated() {
    if (this.#pendingSnackbarMessages.length > 0) {
      for (const {message, replaceAll} of this.#pendingSnackbarMessages) {
        this.#snackbar.show(message, replaceAll);
      }
      this.#pendingSnackbarMessages = [];
    }
  }

  render() {
    return [
      this.#renderThemeToggle(),
      this.#maybeRenderForm(),
      this.#maybeRenderData(),
      this.#maybeRenderError(),
      html`<ui-snackbar></ui-snackbar>`,
    ];
  }

  #renderThemeToggle() {
    return html` <div>
      <button
        @click=${(evt: Event) => {
          if (!(evt.target instanceof HTMLButtonElement)) return;
          const {colorScheme} = window.getComputedStyle(evt.target);
          if (colorScheme === 'dark') {
            document.body.classList.add('light');
            document.body.classList.remove('dark');
          } else {
            document.body.classList.add('dark');
            document.body.classList.remove('light');
          }
        }}
        class="theme-toggle"
      >
        <span class="material-symbols"></span>
      </button>
    </div>`;
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
        const body = data.get('body') ?? null;
        if (!body) {
          return;
        }
        const message = body as any;
        await this.#sendAndProcessMessage(message);
      }}
    >
      ${this.config.heroImage
        ? html`<div
            style=${styleMap({
              '--background-image-light': `url(${this.config.heroImage})`,
              '--background-image-dark': `url(${
                this.config.heroImageDark ?? this.config.heroImage
              })`,
            })}
            id="hero-img"
          ></div>`
        : nothing}
      <h1 class="app-title">${this.config.title}</h1>
      <div>
        <input
          required
          value="${this.config.placeholder}"
          autocomplete="off"
          id="body"
          name="body"
          type="text"
          ?disabled=${this.#requesting}
        />
        <button type="submit" ?disabled=${this.#requesting}>
          <span class="material-symbols">send</span>
        </button>
      </div>
    </form>`;
  }

  #startLoadingAnimation() {
    if (this.config.loadingText && this.config.loadingText.length > 1) {
      this.#loadingTextIndex = 0;
      this.#loadingInterval = window.setInterval(() => {
        this.#loadingTextIndex = (this.#loadingTextIndex + 1) % this.config.loadingText!.length;
      }, 2000);
    }
  }

  #stopLoadingAnimation() {
    if (this.#loadingInterval) {
      clearInterval(this.#loadingInterval);
      this.#loadingInterval = undefined;
    }
  }

  async #sendMessage(message: any): Promise<any[]> {
    try {
      this.#requesting = true;
      this.#startLoadingAnimation();
      const response = this.#a2uiClient.send(message);
      await response;
      this.#requesting = false;
      this.#stopLoadingAnimation();

      return response;
    } catch (err) {
      console.error(err);
    } finally {
      this.#requesting = false;
      this.#stopLoadingAnimation();
    }

    return [];
  }

  #maybeRenderData() {
    if (this.#requesting) {
      const text = this.config.loadingText
        ? this.config.loadingText[this.#loadingTextIndex]
        : 'Awaiting an answer...';

      return html` <div class="pending">
        <div class="spinner"></div>
        <div class="loading-text">${text}</div>
      </div>`;
    }

    const surfaces = Array.from(this.#processor.model.surfacesMap.entries());
    if (surfaces.length === 0) {
      return nothing;
    }
    console.debug('Rendering surfaces', surfaces);

    return html`<section id="surfaces">
      ${repeat(
        surfaces,
        ([surfaceId]) => surfaceId,
        ([_, surface]) => {
          return html`<a2ui-surface .surface=${surface}></a2ui-surface>`;
        },
      )}
    </section>`;
  }

  async #sendAndProcessMessage(request) {
    const messages = await this.#sendMessage(request);
    console.debug('Received messages', messages);

    this.#lastMessages = messages;

    // this.#processor.clearSurfaces();
    // Why? Shouldn't `deleteSurface` be sent from the agent to the client?
    for (const surfaceId of Array.from(this.#processor.model.surfacesMap.keys())) {
      this.#processor.model.deleteSurface(surfaceId);
    }

    this.#processor.processMessages(messages);
  }
}
