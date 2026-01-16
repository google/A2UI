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

import { html, css, nothing } from "lit";
import { customElement } from "lit/decorators.js";
import { Root } from "./root.js";
import { classMap } from "lit/directives/class-map.js";
import { A2uiMessageProcessor } from "../../core/a2ui_message_processor.js";
import { styleMap } from "lit/directives/style-map.js";
import { structuralStyles } from "./styles.js";
import { SliderNode } from "../../core/standard_catalog_api/slider.js";
import { extractNumberValue } from "../utils/utils.js";

@customElement("a2ui-slider")
export class Slider extends Root<SliderNode> {

  static styles = [
    structuralStyles,
    css`
      * {
        box-sizing: border-box;
      }

      :host {
        display: block;
        flex: var(--weight);
      }

      input {
        display: block;
        width: 100%;
      }

      .description {
      }
    `,
  ];

  #setBoundValue(value: string) {
    const { value: valueProp } = this.node.properties;
    if (!valueProp || !this.processor) {
      return;
    }

    if (!("path" in valueProp)) {
      return;
    }

    if (!valueProp.path) {
      return;
    }

    this.processor.setData(
      this.node,
      valueProp.path,
      value,
      this.surfaceId ?? A2uiMessageProcessor.DEFAULT_SURFACE_ID
    );
  }

  #renderField(value: string | number) {
    return html`<section
      class=${classMap(this.theme.components.Slider.container)}
    >
      <label class=${classMap(this.theme.components.Slider.label)} for="data">
        ${this.node.properties.value?.literal?.toString() ?? this.node.properties.value?.literalNumber?.toString() ?? ""}
      </label>
      <input
        autocomplete="off"
        class=${classMap(this.theme.components.Slider.element)}
        style=${this.theme.additionalStyles?.Slider
          ? styleMap(this.theme.additionalStyles?.Slider)
          : nothing}
        @input=${(evt: Event) => {
          if (!(evt.target instanceof HTMLInputElement)) {
            return;
          }

          this.#setBoundValue(evt.target.value);
        }}
        id="data"
        name="data"
        .value=${value}
        type="range"
        min=${this.node.properties.minValue ?? "0"}
        max=${this.node.properties.maxValue ?? "0"}
      />
      <span class=${classMap(this.theme.components.Slider.label)}
        >${this.node.properties.value
          ? extractNumberValue(
              this.node.properties.value,
              this.node,
              this.processor,
              this.surfaceId
            )
          : "0"}</span
      >
    </section>`;
  }

  render() {
    const { value } = this.node.properties;
    if (value && typeof value === "object") {
      if ("literalNumber" in value && value.literalNumber !== undefined) {
        return this.#renderField(value.literalNumber);
      } else if ("literal" in value && value.literal !== undefined) {
        return this.#renderField(value.literal as number);
      } else if (value && "path" in value && value.path) {
        if (!this.processor || !this.node) {
          return html`(no processor)`;
        }

        const textValue = this.processor.getData(
          this.node,
          value.path,
          this.surfaceId ?? A2uiMessageProcessor.DEFAULT_SURFACE_ID
        );

        if (textValue === null) {
          return html`Invalid value`;
        }

        if (typeof textValue !== "string" && typeof textValue !== "number") {
          return html`Invalid value`;
        }

        return this.#renderField(textValue);
      }
    }

    return nothing;
  }
}