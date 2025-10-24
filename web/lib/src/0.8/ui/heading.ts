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
import { A2UIModelProcessor } from "../data/model-processor.js";
import { styleMap } from "lit/directives/style-map.js";

@customElement("a2ui-heading")
export class Heading extends Root {
  @property()
  accessor text: StringValue | null = null;

  @property({ reflect: true })
  accessor level = 1;

  static styles = [
    Styles.all,
    css`
      :host {
        display: block;
        flex-grow: 0;
        flex-shrink: 0;
        flex-basis: auto;
        min-height: 0;
        overflow: auto;

        & h1 {
          line-height: 1.2;
        }
      }

      :host([level="1"]) h1 {
        font-size: 24px;
        margin: 0;
        padding: 0;
      }

      :host([level="2"]) h1 {
        font-size: 20px;
        margin: 0;
        padding: 0;
      }

      :host([level="3"]) h1 {
        font-size: 18px;
        margin: 0;
        padding: 0;
      }

      :host([level="4"]) h1 {
        font-size: 16px;
        margin: 0;
        padding: 0;
      }

      :host([level="5"]) h1 {
        font-size: 14px;
        margin: 0;
        padding: 0;
      }
    `,
  ];

  render() {
    if (this.text && typeof this.text === "object") {
      if ("literalString" in this.text) {
        return html`<h1 class=${classMap(this.theme.components.Heading)}>
          ${this.text.literalString}
        </h1>`;
      } else if ("literal" in this.text) {
        return html`<h1 class=${classMap(this.theme.components.Heading)}>
          ${this.text.literal}
        </h1>`;
      } else if (this.text && "path" in this.text && this.text.path) {
        if (!this.processor || !this.component) {
          return html`(no model)`;
        }

        const textValue = this.processor.getData(
          this.component,
          this.text.path,
          this.surfaceId ?? A2UIModelProcessor.DEFAULT_SURFACE_ID
        );
        if (typeof textValue !== "string") {
          return html`(invalid)`;
        }

        return html`<h1
          class=${classMap(this.theme.components.Heading)}
          style=${this.theme.additionalStyles?.Heading
            ? styleMap(this.theme.additionalStyles?.Heading)
            : nothing}
        >
          ${textValue}
        </h1>`;
      }
    }

    return html`(empty)`;
  }
}
