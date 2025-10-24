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
import { customElement, property } from "lit/decorators.js";
import { Root } from "./root.js";
import { StringValue } from "../types/primitives.js";
import * as Styles from "./styles/index.js";
import { classMap } from "lit/directives/class-map.js";
import { ResolvedTextField } from "../types/types";
import { A2UIModelProcessor } from "../data/model-processor.js";
import { styleMap } from "lit/directives/style-map.js";

@customElement("a2ui-textfield")
export class TextField extends Root {
  @property()
  accessor text: StringValue | null = null;

  @property()
  accessor label: StringValue | null = null;

  @property()
  accessor inputType: ResolvedTextField["type"] | null = null;

  static styles = [
    Styles.all,
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
        font-size: 14px;
        margin-bottom: 4px;
      }
    `,
  ];

  #setBoundValue(value: string) {
    if (!this.text || !this.processor) {
      return;
    }
    if (!("path" in this.text)) {
      return;
    }
    if (!this.text.path) {
      return;
    }

    this.processor.setData(
      this.component,
      this.text.path,
      value,
      this.surfaceId ?? A2UIModelProcessor.DEFAULT_SURFACE_ID
    );
  }

  #renderField(value: string | number) {
    return html` <section>
      <input
        autocomplete="off"
        class=${classMap(this.theme.components.TextField)}
        style=${this.theme.additionalStyles?.TextField
          ? styleMap(this.theme.additionalStyles?.TextField)
          : nothing}
        @input=${(evt: Event) => {
          if (!(evt.target instanceof HTMLInputElement)) {
            return;
          }

          this.#setBoundValue(evt.target.value);
        }}
        id="data"
        .value=${value}
        .placeholder=${this.label?.literalString ?? ""}
        type=${this.inputType === "number" ? "number" : "text"}
      />
    </section>`;
  }

  render() {
    if (this.text && typeof this.text === "object") {
      if ("literalString" in this.text && this.text.literalString) {
        return this.#renderField(this.text.literalString);
      } else if ("literal" in this.text && this.text.literal !== undefined) {
        return this.#renderField(this.text.literal);
      } else if (this.text && "path" in this.text && this.text.path) {
        if (!this.processor || !this.component) {
          return html`(no model)`;
        }

        const textValue = this.processor.getData(
          this.component,
          this.text.path,
          this.surfaceId ?? A2UIModelProcessor.DEFAULT_SURFACE_ID
        );

        if (textValue === null) {
          return html`Invalid label`;
        }

        if (typeof textValue !== "string") {
          return html`Invalid label`;
        }

        return this.#renderField(textValue);
      }
    }

    return nothing;
  }
}
