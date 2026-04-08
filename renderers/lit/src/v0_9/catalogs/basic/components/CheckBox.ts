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
import { CheckBoxApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { A2uiLitElement, A2uiController } from "@a2ui/lit/v0_9";
import { injectBasicCatalogStyles } from "@a2ui/web_core/v0_9/basic_catalog";

@customElement("a2ui-checkbox")
export class A2uiCheckBoxElement extends A2uiLitElement<typeof CheckBoxApi> {
  /**
   * The styles of the checkbox can be customized by redefining the following
   * CSS variables:
   *
   * - `--a2ui-checkbox-size`: Size of the box. Defaults to `1rem`.
   * - `--a2ui-checkbox-border-radius`: Default corner rounding of the box.
   * - `--a2ui-checkbox-gap`: Spacing between the checkbox and its label. Defaults to `8px`.
   */
  static styles = css`
    :host {
      display: inline-block;
    }
    label.a2ui-checkbox {
      display: inline-flex;
      align-items: center;
      gap: var(--a2ui-checkbox-gap, var(--a2ui-spacing-s, 0.5rem));
      font-size: var(--a2ui-checkbox-label-font-size, inherit);
      cursor: pointer;
    }
    input {
      width: var(--a2ui-checkbox-size, 1rem);
      height: var(--a2ui-checkbox-size, 1rem);
      background: var(--a2ui-checkbox-background, inherit);
      border: var(--a2ui-checkbox-border, auto);
      border-radius: var(--a2ui-checkbox-border-radius, 4px);
    }
  `;

  protected createController() {
    return new A2uiController(this, CheckBoxApi);
  }

  connectedCallback() {
    super.connectedCallback();
    injectBasicCatalogStyles();
  }

  render() {
    const props = this.controller.props;
    if (!props) return nothing;

    return html`
      <label class="a2ui-checkbox">
        <input
          type="checkbox"
          .checked=${props.value || false}
          @change=${(e: Event) =>
            props.setValue?.((e.target as HTMLInputElement).checked)}
        />
        ${props.label}
      </label>
    `;
  }
}

export const A2uiCheckBox = {
  ...CheckBoxApi,
  tagName: "a2ui-checkbox",
};
