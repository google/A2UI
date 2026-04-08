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
import { SliderApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { A2uiLitElement, A2uiController } from "@a2ui/lit/v0_9";
import { injectBasicCatalogStyles } from "@a2ui/web_core/v0_9/basic_catalog";

@customElement("a2ui-slider")
export class A2uiSliderElement extends A2uiLitElement<typeof SliderApi> {
  /**
   * The slider can be customized with the following CSS variables:
   *
   * - `--a2ui-slider-track-color`: Color of the slider track. Defaults to `--a2ui-color-secondary`.
   * - `--a2ui-slider-thumb-color`: Color of the slider thumb. Defaults to `--a2ui-color-primary`.
   */
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      gap: var(--a2ui-spacing-s, 0.5rem);
    }
    input[type="range"] {
      accent-color: var(--a2ui-slider-thumb-color, var(--a2ui-color-primary, #007bff));
      background: var(--a2ui-slider-track-color, var(--a2ui-color-secondary, #e9ecef));
    }
  `;

  protected createController() {
    return new A2uiController(this, SliderApi);
  }

  connectedCallback() {
    super.connectedCallback();
    injectBasicCatalogStyles();
  }

  render() {
    const props = this.controller.props;
    if (!props) return nothing;

    return html`
      ${props.label ? html`<label>${props.label}</label>` : nothing}
      <input
        type="range"
        min=${props.min ?? 0}
        max=${props.max ?? 100}
        .value=${props.value?.toString() || "0"}
        @input=${(e: Event) =>
          props.setValue?.(Number((e.target as HTMLInputElement).value))}
      />
      <span>${props.value}</span>
    `;
  }
}

export const A2uiSlider = {
  ...SliderApi,
  tagName: "a2ui-slider",
};
