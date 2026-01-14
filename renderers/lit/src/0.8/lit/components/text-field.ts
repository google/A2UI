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
import { extractStringValue } from "../utils/utils.js";
import { structuralStyles } from "./styles.js";
import { TextFieldNode } from "../../core/standard_catalog_api/text_field.js";

@customElement("a2ui-textfield")
export class TextField extends Root<TextFieldNode> {

  static styles = [
    structuralStyles,
    css`
      * {
        box-sizing: border-box;
      }

      :host {
        display: flex;
        flex: var(--weight);
      }

      input {
        display: block;
        width: 100%;
      }

      label {
        display: block;
        margin-bottom: 4px;
      }
    `,
  ];

  #setBoundValue(value: string) {
    const { text } = this.node.properties;
    if (!text || !this.processor) {
      return;
    }
    if (!("path" in text)) {
      return;
    }
    if (!text.path) {
      return;
    }

    this.processor.setData(
      this.node,
      text.path,
      value,
      this.surfaceId ?? A2uiMessageProcessor.DEFAULT_SURFACE_ID
    );
  }

  #renderField(value: string | number, label: string) {
    return html` <section
      class=${classMap(this.theme.components.TextField.container)}
    >
      ${label && label !== ""
        ? html`<label
            class=${classMap(this.theme.components.TextField.label)}
            for="data"
            >${label}</label
          >`
        : nothing}
      <input
        autocomplete="off"
        class=${classMap(this.theme.components.TextField.element)}
        style=${this.theme.additionalStyles?.TextField
          ? styleMap(this.theme.additionalStyles?.TextField)
          : nothing}
        @input=${(evt: Event) => {
          if (!(evt.target instanceof HTMLInputElement)) {
            return;
          }

          this.#setBoundValue(evt.target.value);
        }}
        name="data"
        id="data"
        .value=${value}
        .placeholder=${"Please enter a value"}
        type=${this.node.properties.type === "number" ? "number" : "text"}
      />
    </section>`;
  }

  render() {
    const label = extractStringValue(
      this.node.properties.label,
      this.node,
      this.processor,
      this.surfaceId
    );
    const value = extractStringValue(
      this.node.properties.text,
      this.node,
      this.processor,
      this.surfaceId
    );

    return this.#renderField(value, label);
  }
}
