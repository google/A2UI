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
import { CheckboxNode } from "../../core/types/types.js";

@customElement("a2ui-checkbox")
export class Checkbox extends Root<CheckboxNode> {

  static styles = [
    structuralStyles,
    css`
      * {
        box-sizing: border-box;
      }

      :host {
        display: block;
        flex: var(--weight);
        min-height: 0;
        overflow: auto;
      }

      input {
        display: block;
        width: 100%;
      }

      .description {
        font-size: 14px;
        margin-bottom: 4px;
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

  #renderField(value: boolean | number) {
    const { label } = this.node.properties;
    return html` <section
      class=${classMap(this.theme.components.CheckBox.container)}
      style=${this.theme.additionalStyles?.CheckBox
        ? styleMap(this.theme.additionalStyles?.CheckBox)
        : nothing}
    >
      <input
        class=${classMap(this.theme.components.CheckBox.element)}
        autocomplete="off"
        @input=${(evt: Event) => {
          if (!(evt.target instanceof HTMLInputElement)) {
            return;
          }

          this.#setBoundValue(evt.target.value);
        }}
        id="data"
        type="checkbox"
        .value=${value}
      />
      <label class=${classMap(this.theme.components.CheckBox.label)} for="data"
        >${label?.literalString}</label
      >
    </section>`;
  }

  render() {
    const { value } = this.node.properties;
    if (value && typeof value === "object") {
      if ("literalBoolean" in value && value.literalBoolean) {
        return this.#renderField(value.literalBoolean);
      } else if ("literal" in value && value.literal !== undefined) {
        return this.#renderField(value.literalBoolean ?? value.literal ?? false);
      } else if (value && "path" in value && value.path) {
        if (!this.processor || !this.node) {
          return html`(no model)`;
        }

        const textValue = this.processor.getData(
          this.node,
          value.path,
          this.surfaceId ?? A2uiMessageProcessor.DEFAULT_SURFACE_ID
        );

        if (textValue === null) {
          return html`Invalid label`;
        }

        if (typeof textValue !== "boolean") {
          return html`Invalid label`;
        }

        return this.#renderField(textValue);
      }
    }

    return nothing;
  }
}