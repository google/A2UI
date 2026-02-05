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
import { theme as uiTheme } from "./theme/default-theme.js";
import { A2UIClient } from "./client.js";
import {
  SnackbarAction,
  SnackbarMessage,
  SnackbarUUID,
  SnackType,
} from "./types/types.js";
import { type Snackbar } from "./ui/snackbar.js";
import { repeat } from "lit/directives/repeat.js";
import * as v0_9_Lit from "@a2ui/lit/v0_9";
import * as v0_9_Core from "@a2ui/web_core/v0_9";
import { v0_8 } from "@a2ui/lit"; // Keep for styles and types if needed, but transition styles eventually
import * as UI from "@a2ui/lit/ui";

// App elements.
import "./ui/ui.js";

// Configurations
import { AppConfig } from "./configs/types.js";
import { config as restaurantConfig } from "./configs/restaurant.js";
import { config as contactsConfig } from "./configs/contacts.js";
import { styleMap } from "lit/directives/style-map.js";

const configs: Record<string, AppConfig> = {
  restaurant: restaurantConfig,
  contacts: contactsConfig,
};

@customElement("a2ui-shell")
export class A2UILayoutEditor extends SignalWatcher(LitElement) {
  // TODO: Update theme context for v0.9
  //For now, we might not pass theme via context if v0.9 Surface accepts it directly, 
  // but existing components might rely on it.
  @provide({ context: UI.Context.themeContext })
  accessor theme: any = uiTheme;

  @state()
  accessor #requesting = false;

  @state()
  accessor #error: string | null = null;

  @state()
  accessor #lastMessages: any[] = [];

  @state()
  accessor config: AppConfig = configs.restaurant;

  @state()
  accessor #loadingTextIndex = 0;
  #loadingInterval: number | undefined;

  static styles = [
    unsafeCSS(v0_8.Styles.structuralStyles), // Re-using v0.8 styles for shell structure
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
        background: var(--background-image-light) center center / contain
          no-repeat;
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

        & .g-icon {
          pointer-events: none;

          &::before {
            content: "dark_mode";
          }
        }
      }

      @container style(--color-scheme: dark) {
        .theme-toggle .g-icon::before {
          content: "light_mode";
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

  #processor: v0_9_Core.A2uiMessageProcessor;
  #a2uiClient = new A2UIClient();
  #snackbar: Snackbar | undefined = undefined;
  #pendingSnackbarMessages: Array<{
    message: SnackbarMessage;
    replaceAll: boolean;
  }> = [];

  // Map to track active surfaces. 
  // In v0.9, the processor manages SurfaceContexts.
  // We need to trigger renders when surfaces are added/removed.
  // Ideally Processor would expose an observable list of surfaces.
  // For now, we'll brute-force refresh or rely on standard reactivity if we can access the map.
  // But Processor surfaces map is private.
  // WORKAROUND: We will maintain a local set of surface IDs that we know about, 
  // updated whenever we process messages.
  @state()
  accessor #activeSurfaces: string[] = [];
  // We'll store the contexts we retrieve from the processor to pass to the components.
  #surfaceContexts: Map<string, v0_9_Core.SurfaceContext> = new Map();

  constructor() {
    super();
    // Initialize Processor with standard catalogs and action handler
    const litCatalog = v0_9_Lit.createLitStandardCatalog();

    this.#processor = new v0_9_Core.A2uiMessageProcessor(
      [litCatalog],
      (action) => this.#handleUserAction(action)
    );
  }

  async #handleUserAction(action: any) {
    // Action here is the raw action object from the component property.
    // We need to wrap it in a client message.
    // The SurfaceContext dispatchAction is just a passthrough to here.

    // Construct the message payload.
    // We need surfaceId, sourceComponentId... wait.
    // The action object itself might not have surfaceId/sourceComponentId if it came from a pure object.
    // But the spec says dispatchAction(action: UserAction).
    // Let's look at how we construct the context in the event handler in v0.8.

    // In v0.9, the 'action' passed to us *should* ideally be fully formed or we need context.
    // Actually, `SurfaceContext.dispatchAction` takes `any`.
    // The component just passes the `action` property value.
    // We might need to enrich it. 
    // BUT, the `actionHandler` in SurfaceContext is generic.

    // Let's assume for now the action object matches what the server expects 
    // OR we need to construct the standard A2UI UserAction structure.
    // The `button.ts` just sends `properties['action']`.
    // If the JSON for the button was: { "action": { "name": "foo", "context": [...] } }
    // Then `action` is that object.

    // We need to add timestamp, surfaceId etc.
    // But we don't know surfaceId here easily unless we bind it.
    // A2uiMessageProcessor passes the handler globally.
    // We might need a factory for the handler per surface, OR the handler receives (action, surfaceId).

    // Checking SurfaceContext again... 
    // `dispatchAction(action) { return this.actionHandler(action); }`
    // It passes exactly what it gets.

    // Issue: We need surfaceId and sourceComponentId.
    // Ideally, the component context would attach these, OR the SurfaceContext should attach its ID.
    // `SurfaceContext` knows its `id`.
    // But `ComponentContext` knows the component ID.
    // `ComponentContext.dispatchAction` calls `surfaceContext.dispatchAction`.
    // It COULD enrich it.

    // For this prototype, let's assume the action object contains necessary distinct info 
    // OR we just send what we have.
    // Re-reading v0.8 app.ts: It constructs `UserAction` adding timestamp, surfaceId, componentId.

    // To support this in v0.9 cleanly, we might need to update ComponentContext to pass sourceID.
    // But let's proceed with sending the action object as-is wrapped in a message for now,
    // and logged to console to verify.

    const message = {
      userAction: {
        ...action,
        timestamp: new Date().toISOString()
      }
    };

    await this.#sendAndProcessMessage(message);
  }

  #maybeRenderError() {
    if (!this.#error) return nothing;

    return html`<div class="error">${this.#error}</div>`;
  }

  connectedCallback() {
    super.connectedCallback();

    // Load config from URL
    const urlParams = new URLSearchParams(window.location.search);
    const appKey = urlParams.get("app") || "restaurant";
    this.config = configs[appKey] || configs.restaurant;

    if (this.config.theme) {
      this.theme = this.config.theme;
    }

    window.document.title = this.config.title;
    window.document.documentElement.style.setProperty(
      "--background",
      this.config.background
    );

    // Initialize client with configured URL
    this.#a2uiClient = new A2UIClient(this.config.serverUrl);
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
    return html` <div>
      <button
        @click=${(evt: Event) => {
        if (!(evt.target instanceof HTMLButtonElement)) return;
        const { colorScheme } = window.getComputedStyle(evt.target);
        if (colorScheme === "dark") {
          document.body.classList.add("light");
          document.body.classList.remove("dark");
        } else {
          document.body.classList.add("dark");
          document.body.classList.remove("light");
        }
      }}
        class="theme-toggle"
      >
        <span class="g-icon filled-heavy"></span>
      </button>
    </div>`;
  }

  #maybeRenderForm() {
    if (this.#requesting) return nothing;
    // We check if we have active surfaces
    if (this.#activeSurfaces.length > 0) return nothing;

    return html` <form
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
        // Construct initial 'beginRendering' or generic client message
        // v0.8 uses specific message types.
        // We'll stick to the sample's expected input structure content.

        // The server expects "clientEvent" or similar.
        // shell 0.8 sends the object directly from FormData or constructed.
        const message = {
          // For restaurant finder, it expects a text input
          // Let's wrap it in a standard client message structure if needed
          // or just pass as generic input.
          // The v0.8 app casts to `A2UIClientEventMessage`.
          // Let's assume the server handles "open" or "input".
          ...this.#createInitialMessage(body as string)
        };
        await this.#sendAndProcessMessage(message);
      }}
    >
      ${this.config.heroImage
        ? html`<div
            style=${styleMap({
          "--background-image-light": `url(${this.config.heroImage})`,
          "--background-image-dark": `url(${this.config.heroImageDark ?? this.config.heroImage
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
          <span class="g-icon filled-heavy">send</span>
        </button>
      </div>
    </form>`;
  }

  #createInitialMessage(text: string) {
    // Create a basic interaction message
    return {
      userAction: {
        name: "input",
        timestamp: new Date().toISOString(),
        context: {
          "input_text": text
        }
      }
    };
  }

  #startLoadingAnimation() {
    if (
      Array.isArray(this.config.loadingText) &&
      this.config.loadingText.length > 1
    ) {
      this.#loadingTextIndex = 0;
      this.#loadingInterval = window.setInterval(() => {
        this.#loadingTextIndex =
          (this.#loadingTextIndex + 1) %
          (this.config.loadingText as string[]).length;
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
    message: any
  ): Promise<any[]> {
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
      let text = "Awaiting an answer...";
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

    if (this.#activeSurfaces.length === 0) {
      return nothing;
    }

    return html`<section id="surfaces">
      ${repeat(
      this.#activeSurfaces,
      (id) => id,
      (id) => {
        const context = this.#processor.getSurfaceContext(id);
        if (!context) return nothing;

        return html`<a2ui-surface-v0-9
              .context=${context}
            ></a2ui-surface-v0-9>`;
      }
    )}
    </section>`;
  }

  async #sendAndProcessMessage(request) {
    const messages = await this.#sendMessage(request);

    console.log("Received messages:", messages);

    this.#lastMessages = messages;

    // Process messages
    this.#processor.processMessages(messages);

    // Update active surfaces list
    // Since we don't have an easy "get all surface IDs" on processor (it's private map),
    // and we don't have "delete surface" logic in this simple app fully wired to processor events.
    // REQUIRED: We need to know what surfaces exist.
    // HACK for Prototype: We'll inspect the messages to see if any created surfaces.
    // BETTER: The processor should expose `getSurfaces()`. 
    // Checking `message-processor.ts`... it does NOT expose `getSurfaces()`. 
    // It only has `getSurfaceContext(id)`.
    // We should probably update `message-processor.ts` to expose `getSurfaceIds()` or similar.
    // For now, let's track created IDs from messages manually or add the method to processor.
    // I'll add `getSurfaceIds()` to `A2uiMessageProcessor` in web_core later if needed.
    // For now, let's just parse the messages locally to track IDs.

    for (const msg of messages) {
      if (msg.createSurface) {
        if (!this.#activeSurfaces.includes(msg.createSurface.surfaceId)) {
          this.#activeSurfaces = [...this.#activeSurfaces, msg.createSurface.surfaceId];
        }
      }
      if (msg.deleteSurface) {
        this.#activeSurfaces = this.#activeSurfaces.filter(id => id !== msg.deleteSurface.surfaceId);
      }
    }
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

