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

import { html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { Root } from "./root.js";
import { StringValue } from "../types/primitives.js";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";
import { structuralStyles } from "./styles.js";
import { extractStringValue } from "./utils/utils.js";
import { StateEvent } from "../events/events.js";

// --- SECURITY CONFIGURATION ---
// Domains in this list are allowed to run scripts and forms.
// All other domains will be rendered in a strict, script-free sandbox.
const TRUSTED_DOMAINS = [
  "openstreetmap.org",
  "www.openstreetmap.org",
  "youtube.com",
  "www.youtube.com",
  "google.com",
  "www.google.com"
];

@customElement("a2ui-webframe")
export class WebFrame extends Root {
  @property() accessor url: StringValue | null = null;
  @property({ type: Number }) accessor height = 200;
  @property() accessor interactionMode: "readOnly" | "interactive" = "readOnly";
  @property({ type: Array }) accessor allowedEvents: string[] = [];

  static styles = [
    structuralStyles,
    css`
      :host {
        display: block;
        flex: var(--weight);
        min-height: 0;
        overflow: hidden;
      }
      iframe {
        width: 100%;
        border: none;
        display: block;
      }
      .blocked-message {
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f5f5f5;
        color: #666;
        font-size: 0.9rem;
        padding: 20px;
        text-align: center;
        border: 1px dashed #ccc;
      }
    `,
  ];

  #handleMessage = (evt: MessageEvent) => {
    const iframe = this.shadowRoot?.querySelector("iframe");
    if (!iframe || evt.source !== iframe.contentWindow) {
      return;
    }

    const data = evt.data;
    if (!data || data.type !== "a2ui_action") {
      return;
    }

    const actionName = data.action;
    if (this.allowedEvents && !this.allowedEvents.includes(actionName)) {
      console.warn(`Blocked unauthorized action from iframe: ${actionName}`);
      return;
    }

    const contextItems = [];
    if (data.data && typeof data.data === "object") {
      for (const [k, v] of Object.entries(data.data)) {
        let valObj;
        if (typeof v === "string") valObj = { literalString: v };
        else if (typeof v === "number") valObj = { literalNumber: v };
        else if (typeof v === "boolean") valObj = { literalBoolean: v };
        else continue;

        contextItems.push({ key: k, value: valObj });
      }
    }

    const syntheticAction = {
      name: actionName,
      context: contextItems,
    };

    this.dispatchEvent(
      new StateEvent<"a2ui.action">({
        eventType: "a2ui.action",
        action: syntheticAction,
        dataContextPath: this.dataContextPath,
        sourceComponentId: this.id,
        sourceComponent: this.component,
      })
    );
  };

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("message", this.#handleMessage);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("message", this.#handleMessage);
  }

  render() {
    const src = extractStringValue(
      this.url,
      this.component,
      this.processor,
      this.surfaceId
    );

    if (!src) return html``;

    let hostname = "";
    try {
      hostname = new URL(src).hostname;
    } catch (e) {
      console.warn("Invalid URL in WebFrame:", src);
      return html`<div class="blocked-message">Invalid URL</div>`;
    }

    // 1. Check Allowlist
    const isTrusted = TRUSTED_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );

    let sandbox = "";

    if (isTrusted) {
      // Trusted Domain: We allow scripts.
      // If interactionMode is interactive, we also allow forms and same-origin.
      // Note: 'allow-scripts' is REQUIRED for Maps/YouTube to render at all.
      sandbox = "allow-scripts";

      if (this.interactionMode === "interactive") {
        sandbox += " allow-forms allow-popups allow-presentation";
      }
    } else {
      // Untrusted Domain: Strict Lockdown.
      // Sandbox is empty (no scripts, no forms, no origin).
      // This renders static HTML only.
      console.warn(`Untrusted domain ${hostname}. Scripts blocked.`);
      sandbox = "";
    }

    return html`
      <section
        class=${classMap(this.theme.components.WebFrame?.container || {})}
      >
        <iframe
          src=${src}
          height=${this.height}
          sandbox=${sandbox}
          style=${styleMap(this.theme.additionalStyles?.WebFrame || {})}
          class=${classMap(this.theme.components.WebFrame?.element || {})}
        ></iframe>
      </section>
    `;
  }
}