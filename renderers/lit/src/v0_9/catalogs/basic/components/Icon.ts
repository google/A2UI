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
import { IconApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { A2uiLitElement, A2uiController } from "@a2ui/lit/v0_9";
import { injectBasicCatalogStyles } from "@a2ui/web_core/v0_9/basic_catalog";

import { classMap } from "lit/directives/class-map.js";

const ICON_MAP: Record<string, string> = {
  favoriteOff: "favorite_border",
  play: "play_arrow",
  rewind: "fast_rewind",
  starOff: "star_border",
};

@customElement("a2ui-icon")
export class A2uiIconElement extends A2uiLitElement<typeof IconApi> {
  /**
   * The icon component can be customized with the following CSS variables:
   *
   * - `--a2ui-icon-size`: Dimensions of the icon.
   * - `--a2ui-icon-color`: Color tint applied to the icon.
   * - `--a2ui-icon-font-family`: Override the font family for icons. Defaults to Material Symbols Outlined.
   * - `--a2ui-icon-font-variation-settings`: Complete override for font-variation-settings.
   */
  static styles = css`
    :where(:host) {
      --_icon-size: var(--a2ui-icon-size, var(--a2ui-font-size-xl, 24px));
    }
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .material-symbol {
      font-family: var(--a2ui-icon-font-family, "Material Symbols Outlined", sans-serif);
      font-size: var(--_icon-size);
      font-weight: normal;
      font-style: normal;
      line-height: 1;
      letter-spacing: normal;
      text-transform: none;
      color: var(--a2ui-icon-color, inherit);
      font-variation-settings: var(--a2ui-icon-font-variation-settings, "FILL" 1);
    }
  `;

  private getIconName(rawName: string): string {
    if (ICON_MAP[rawName]) return ICON_MAP[rawName];
    return rawName.replace(/[A-Z]/g, (letter: string) => `_${letter.toLowerCase()}`);
  }

  protected createController() {
    return new A2uiController(this, IconApi);
  }

  connectedCallback() {
    super.connectedCallback();
    injectBasicCatalogStyles();
  }

  render() {
    const props = this.controller.props;
    if (!props) return nothing;

    const rawName =
      typeof props.name === "string" ? props.name : (props.name as any)?.path;
    const name = rawName ? this.getIconName(rawName) : "";

    return html`<span class=${classMap({ "material-symbol": true })}
      >${name}</span
    >`;
  }
}

export const A2uiIcon = {
  ...IconApi,
  tagName: "a2ui-icon",
};
