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
  HTMLTemplateResult,
  unsafeCSS,
} from "lit";
import { customElement, state } from "lit/decorators.js";
import { theme as uiTheme } from "./theme/theme.js";
import { A2UIClient } from "./client.js";
import {
  SnackbarAction,
  SnackbarMessage,
  SnackbarUUID,
  SnackType,
} from "./types/types.js";
import { type Snackbar } from "./ui/snackbar.js";
import { repeat } from "lit/directives/repeat.js";
import { v0_8 } from "@a2ui/web-lib";
import * as UI from "@a2ui/web-lib/ui";

// App elements.
import "./ui/ui.js";
import { ThemeManager } from "@a2ui/web-lib/ui";
// @ts-expect-error Inline import
import elegantTheme from "./theme/styles.css?inline";

// Configurations
import { AppConfig } from "./configs/types.js";
import { config as restaurantConfig } from "./configs/restaurant.js";
import { config as contactsConfig } from "./configs/contacts.js";

const configs: Record<string, AppConfig> = {
  restaurant: restaurantConfig,
  contacts: contactsConfig,
};

ThemeManager.register(elegantTheme);

@customElement("a2ui-shell")
export class A2UILayoutEditor extends SignalWatcher(LitElement) {
  @provide({ context: UI.Context.themeContext })
  accessor theme: v0_8.Types.Theme = uiTheme;

  @state()
  accessor #requesting = false;

  @state()
  accessor #error: string | null = null;

  @state()
  accessor #lastMessages: v0_8.Types.ServerToClientMessage[] = [];

  @state()
  accessor config: AppConfig = configs.restaurant;

  static styles = [
    unsafeCSS(v0_8.Styles.structuralStyles),
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

      .loading-text {
        font-size: 1.2rem;
        font-weight: 600;
        background: var(--primary-gradient);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: pulse 2s infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      @keyframes pulse {
        0% { opacity: 0.6; }
        50% { opacity: 1; }
        100% { opacity: 0.6; }
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

      .app-title {
        font-size: 2.5rem;
        font-weight: 800;
        background: var(--primary-gradient);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        margin: 0 0 1rem 0;
        text-align: center;
        letter-spacing: -1px;
        line-height: 1.2;
      }
    `,
  ];

  #processor = v0_8.Data.createSignalA2UIModelProcessor();
  #a2uiClient = new A2UIClient();
  #snackbar: Snackbar | undefined = undefined;
  #pendingSnackbarMessages: Array<{
    message: SnackbarMessage;
    replaceAll: boolean;
  }> = [];

  #maybeRenderError() {
    if (!this.#error) return nothing;

    return html`<div class="error">${this.#error}</div>`;
  }

  @state()
  accessor #isDark = false;

  connectedCallback() {
    super.connectedCallback();

    // Load config from URL
    const urlParams = new URLSearchParams(window.location.search);
    const appKey = urlParams.get('app') || 'restaurant';
    this.config = configs[appKey] || configs.restaurant;

    // Initialize client with configured URL
    this.#a2uiClient = new A2UIClient(this.config.serverUrl);

    this.#injectGlobalStyles();
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.#isDark = true;
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.style.colorScheme = 'light';
    }
  }

  #injectGlobalStyles() {
    const styleId = 'a2ui-global-theme-vars';
    if (document.getElementById(styleId)) return;

    // Generate CSS variables from config
    const themeOverrides = Object.entries(this.config.theme)
      .map(([key, val]) => `${key}: ${val};`)
      .join('\n');

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      :root {
        color-scheme: light dark;

        /* Palette Variables */
        --n-100: #ffffff;
        --n-99: #fcfcfc;
        --n-98: #f9f9f9;
        --n-95: #f1f1f1;
        --n-90: #e2e2e2;
        --n-80: #c6c6c6;
        --n-70: #ababab;
        --n-60: #919191;
        --n-50: #777777;
        --n-40: #5e5e5e;
        --n-35: #525252;
        --n-30: #474747;
        --n-25: #3b3b3b;
        --n-20: #303030;
        --n-15: #262626;
        --n-10: #1b1b1b;
        --n-5: #111111;
        --n-0: #000000;

        --p-100: #ffffff;
        --p-99: #fffbff;
        --p-98: #fcf8ff;
        --p-95: #f2efff;
        --p-90: #e1e0ff;
        --p-80: #c0c1ff;
        --p-70: #a0a3ff;
        --p-60: #8487ea;
        --p-50: #6a6dcd;
        --p-40: #5154b3;
        --p-35: #4447a6;
        --p-30: #383b99;
        --p-25: #2c2e8d;
        --p-20: #202182;
        --p-15: #131178;
        --p-10: #06006c;
        --p-5: #03004d;
        --p-0: #000000;

        --s-100: #ffffff;
        --s-99: #fffbff;
        --s-98: #fcf8ff;
        --s-95: #f2efff;
        --s-90: #e2e0f9;
        --s-80: #c6c4dd;
        --s-70: #aaa9c1;
        --s-60: #8f8fa5;
        --s-50: #75758b;
        --s-40: #5d5c72;
        --s-35: #515165;
        --s-30: #454559;
        --s-25: #393a4d;
        --s-20: #2e2f42;
        --s-15: #242437;
        --s-10: #191a2c;
        --s-5: #0f0f21;
        --s-0: #000000;

        --t-100: #ffffff;
        --t-99: #fffbff;
        --t-98: #fff8f9;
        --t-95: #ffecf4;
        --t-90: #ffd8ec;
        --t-80: #e9b9d3;
        --t-70: #cc9eb8;
        --t-60: #af849d;
        --t-50: #946b83;
        --t-40: #79536a;
        --t-35: #6c475d;
        --t-30: #5f3c51;
        --t-25: #523146;
        --t-20: #46263a;
        --t-15: #3a1b2f;
        --t-10: #2e1125;
        --t-5: #22071a;
        --t-0: #000000;

        --nv-100: #ffffff;
        --nv-99: #fffbff;
        --nv-98: #fcf8ff;
        --nv-95: #f2effa;
        --nv-90: #e4e1ec;
        --nv-80: #c8c5d0;
        --nv-70: #acaab4;
        --nv-60: #918f9a;
        --nv-50: #777680;
        --nv-40: #5e5d67;
        --nv-35: #52515b;
        --nv-30: #46464f;
        --nv-25: #3b3b43;
        --nv-20: #303038;
        --nv-15: #25252d;
        --nv-10: #1b1b23;
        --nv-5: #101018;
        --nv-0: #000000;

        --e-100: #ffffff;
        --e-99: #fffbff;
        --e-98: #fff8f7;
        --e-95: #ffedea;
        --e-90: #ffdad6;
        --e-80: #ffb4ab;
        --e-70: #ff897d;
        --e-60: #ff5449;
        --e-50: #de3730;
        --e-40: #ba1a1a;
        --e-35: #a80710;
        --e-30: #93000a;
        --e-25: #7e0007;
        --e-20: #690005;
        --e-15: #540003;
        --e-10: #410002;
        --e-5: #2d0001;
        --e-0: #000000;

        /* Default Theme Variables using light-dark() */
        --bg-gradient:
          radial-gradient(at 0% 0%, light-dark(rgba(161, 196, 253, 0.3), rgba(6, 182, 212, 0.15)) 0px, transparent 50%),
          radial-gradient(at 100% 0%, light-dark(rgba(255, 226, 226, 0.3), rgba(59, 130, 246, 0.15)) 0px, transparent 50%),
          radial-gradient(at 100% 100%, light-dark(rgba(162, 210, 255, 0.3), rgba(20, 184, 166, 0.15)) 0px, transparent 50%),
          radial-gradient(at 0% 100%, light-dark(rgba(255, 200, 221, 0.3), rgba(99, 102, 241, 0.15)) 0px, transparent 50%),
          linear-gradient(120deg, light-dark(#f0f4f8, #0f172a) 0%, light-dark(#e2e8f0, #1e293b) 100%);

        --card-bg:
          radial-gradient(circle at top left, light-dark(transparent, rgba(6, 182, 212, 0.15)), transparent 40%),
          radial-gradient(circle at bottom right, light-dark(transparent, rgba(139, 92, 246, 0.15)), transparent 40%),
          linear-gradient(135deg, light-dark(rgba(255, 255, 255, 0.7), rgba(30, 41, 59, 0.7)), light-dark(rgba(255, 255, 255, 0.7), rgba(15, 23, 42, 0.8)));

        --card-border: light-dark(
          rgba(255, 255, 255, 0.5),
          rgba(148, 163, 184, 0.1)
        );
        --card-shadow: light-dark(
          0 8px 32px 0 rgba(31, 38, 135, 0.1),
          0 8px 32px 0 rgba(0, 0, 0, 0.4)
        );
        --text-primary: light-dark(#1e1b4b, #e0e7ff);
        --text-secondary: light-dark(#4338ca, #a5b4fc);
        --primary-color: light-dark(#667eea, #06b6d4);
        --primary-gradient: linear-gradient(135deg, light-dark(#818cf8, #06b6d4) 0%, light-dark(#a78bfa, #3b82f6) 100%);
        --input-bg: light-dark(rgba(255, 255, 255, 0.5), rgba(15, 23, 42, 0.5));
        --input-border: light-dark(rgba(0, 0, 0, 0.1), rgba(148, 163, 184, 0.2));
        --toggle-bg: light-dark(rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1));
        --toggle-icon: light-dark(#f1c40f, #fbbf24);
        --button-text: light-dark(#ffffff, #cffafe);

        /* Config Overrides */
        ${themeOverrides}
      }

      body {
        background: var(--bg-gradient);
        background-attachment: fixed;
        background-repeat: no-repeat;
        color: var(--text-primary);
        margin: 0;
        min-height: 100vh;
        transition: background 0.5s ease, color 0.5s ease;
        font-family: 'Outfit', sans-serif;
      }

      /* Holiday Spirit: Snowfall Animation - Only in Dark Mode */
      @media (prefers-color-scheme: dark) {
        @keyframes snow {
          0% { background-position: 0px 0px, 0px 0px, 0px 0px; }
          100% { background-position: 500px 1000px, 400px 400px, 300px 300px; }
        }

        body::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 1;
          background-image:
            radial-gradient(4px 4px at 100px 50px, rgba(255,255,255,0.8) 50%, transparent 50%),
            radial-gradient(6px 6px at 200px 150px, rgba(255,255,255,0.6) 50%, transparent 50%),
            radial-gradient(3px 3px at 300px 250px, rgba(255,255,255,0.9) 50%, transparent 50%),
            radial-gradient(4px 4px at 400px 350px, rgba(255,255,255,0.7) 50%, transparent 50%),
            radial-gradient(6px 6px at 500px 100px, rgba(255,255,255,0.5) 50%, transparent 50%),
            radial-gradient(3px 3px at 50px 200px, rgba(255,255,255,0.8) 50%, transparent 50%),
            radial-gradient(4px 4px at 150px 300px, rgba(255,255,255,0.6) 50%, transparent 50%),
            radial-gradient(6px 6px at 250px 400px, rgba(255,255,255,0.9) 50%, transparent 50%),
            radial-gradient(3px 3px at 350px 500px, rgba(255,255,255,0.7) 50%, transparent 50%);
          background-size: 500px 500px, 400px 400px, 300px 300px;
          animation: snow 10s linear infinite;
        }
      }
    `;
    document.head.appendChild(style);
  }

  #toggleTheme() {
    this.#isDark = !this.#isDark;
    document.documentElement.style.colorScheme = this.#isDark ? 'dark' : 'light';
  }

  render() {
    return [
      this.#renderThemeToggle(),
      this.#maybeRenderForm(),
      this.#maybeRenderData(),
      this.#maybeRenderError(),
    ];
  }

  #renderThemeToggle() {
    return html`
    <div style="position: absolute; top: 20px; right: 20px; z-index: 100;">
      <button
        @click=${this.#toggleTheme}
        style="
          background: var(--toggle-bg);
          border: none;
          border-radius: 50%;
          width: 48px;
          height: 48px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          backdrop-filter: blur(5px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        "
      >
        <span class="g-icon filled-heavy" style="color: var(--toggle-icon); font-size: 24px;">
          ${this.#isDark ? 'dark_mode' : 'light_mode'}
        </span>
      </button>
    </div>`;
  }

  #maybeRenderForm() {
    if (this.#requesting) return nothing;
    if (this.#lastMessages.length > 0) return nothing;

    // Determine hero image based on theme
    const heroSrc = (this.#isDark && this.config.heroImageDark)
      ? this.config.heroImageDark
      : this.config.heroImage;

    return html`
    <form
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
        const message = body as v0_8.Types.A2UIClientEventMessage;
        await this.#sendAndProcessMessage(message);
      }}
    >
      <img
        src="${heroSrc}"
        alt="${this.config.title}"
        style="
          width: 100%;
          max-width: 400px;
          height: auto;
          margin-bottom: 24px;
          display: block;
          margin-left: auto;
          margin-right: auto;
        "
      />
      <h1 class="app-title">
        ${this.config.title}
      </h1>
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
          <span class="g-icon filled-heavy">send</span>
        </button>
      </div>
    </form>`;
  }

  @state()
  accessor #loadingTextIndex = 0;
  #loadingInterval: number | undefined;

  #startLoadingAnimation() {
    if (Array.isArray(this.config.loadingText) && this.config.loadingText.length > 1) {
      this.#loadingTextIndex = 0;
      this.#loadingInterval = window.setInterval(() => {
        this.#loadingTextIndex = (this.#loadingTextIndex + 1) % (this.config.loadingText as string[]).length;
      }, 2000);
    }
  }

  #stopLoadingAnimation() {
    if (this.#loadingInterval) {
      clearInterval(this.#loadingInterval);
      this.#loadingInterval = undefined;
    }
  }

  async #sendMessage(
    message: v0_8.Types.A2UIClientEventMessage
  ): Promise<v0_8.Types.ServerToClientMessage[]> {
    try {
      this.#requesting = true;
      this.#startLoadingAnimation();
      const response = this.#a2uiClient.send(message);
      await response;
      this.#requesting = false;
      this.#stopLoadingAnimation();

      return response;
    } catch (err) {
      this.snackbar(err as string, SnackType.ERROR);
    } finally {
      this.#requesting = false;
      this.#stopLoadingAnimation();
    }

    return [];
  }

  #maybeRenderData() {
    if (this.#requesting) {
      let text = 'Awaiting an answer...';
      if (this.config.loadingText) {
        if (Array.isArray(this.config.loadingText)) {
          text = this.config.loadingText[this.#loadingTextIndex];
        } else {
          text = this.config.loadingText;
        }
      }

      return html` <div class="pending">
        <div class="spinner"></div>
        <div class="loading-text">${text}</div>
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
              @a2uiaction=${async (
          evt: v0_8.Events.StateEvent<"a2ui.action">
        ) => {
            const [target] = evt.composedPath();
            if (!(target instanceof HTMLElement)) {
              return;
            }

            const context: v0_8.Types.A2UIClientEventMessage["userAction"]["context"] =
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
                  const value = this.#processor.getData(
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
                name: evt.detail.action.name,
                surfaceId,
                sourceComponentId: target.id,
                timestamp: new Date().toISOString(),
                context,
              },
            };

            await this.#sendAndProcessMessage(message);
          }}
              .surfaceId=${surfaceId}
              .surface=${surface}
              .processor=${this.#processor}
            ></a2-uisurface>`;
      }
    )}
    </section>`;
  }

  async #sendAndProcessMessage(request) {
    const messages = await this.#sendMessage(request);

    this.#lastMessages = messages;
    this.#processor.clearSurfaces();
    this.#processor.processMessages(messages);
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
