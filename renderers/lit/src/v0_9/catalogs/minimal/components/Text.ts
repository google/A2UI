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

import { html, nothing, css } from "lit";
import { customElement } from "lit/decorators.js";
import { TextApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { A2uiLitElement, A2uiController } from "@a2ui/lit/v0_9";
import { injectBasicCatalogStyles } from "@a2ui/web_core/v0_9/basic_catalog";

@customElement("a2ui-text")
export class A2uiTextElement extends A2uiLitElement<typeof TextApi> {
  /**
   * The styles of the text component can be customized by redefining the following
   * CSS variables:
   *
   * - `--a2ui-text-color-text`: The color of the text. Defaults to `--a2ui-color-on-background`.
   *
   * It also uses global font family variables directly:
   * - `--a2ui-font-family-title`: Used for headings (h1-h5).
   * - `--a2ui-font-family-monospace`: Used for future monospace variants.
   *
   * Heading sizes are mapped to global font size variables (`--a2ui-font-size-2xl`, etc.).
   */
  static styles = css`
    :host {
      color: var(--_a2ui-text-color, var(--a2ui-text-color-text, var(--a2ui-color-on-background)));
    }
    p, h1, h2, h3, h4, h5, h6 {
      margin: var(--_a2ui-text-margin, 0);
    }
    h1, h2, h3, h4, h5 {
      font-family: var(--a2ui-font-family-title, inherit);
      line-height: var(--a2ui-line-height-headings, 1.2);
    }
    h1 { font-size: var(--a2ui-font-size-2xl); }
    h2 { font-size: var(--a2ui-font-size-xl); }
    h3 { font-size: var(--a2ui-font-size-l); }
    p, h4 { font-size: var(--a2ui-font-size-m); }
    h5 { font-size: var(--a2ui-font-size-s); }
    p, .caption, .a2ui-caption {
      line-height: var(--a2ui-line-height-body, 1.5);
    }
    .caption, .a2ui-caption { font-size: var(--a2ui-font-size-xs); }
  `;

  protected createController() {
    return new A2uiController(this, TextApi);
  }

  connectedCallback() {
    super.connectedCallback();
    injectBasicCatalogStyles();
  }

  render() {
    const props = this.controller.props;
    if (!props) return nothing;

    const variant = props.variant ?? "body";

    switch (variant) {
      case "h1":
        return html`<h1>${props.text}</h1>`;
      case "h2":
        return html`<h2>${props.text}</h2>`;
      case "h3":
        return html`<h3>${props.text}</h3>`;
      case "h4":
        return html`<h4>${props.text}</h4>`;
      case "h5":
        return html`<h5>${props.text}</h5>`;
      case "caption":
        return html`<span class="caption">${props.text}</span>`;
      default:
        return html`<p>${props.text}</p>`;
    }
  }
}

export const A2uiText = {
  ...TextApi,
  tagName: "a2ui-text",
};
