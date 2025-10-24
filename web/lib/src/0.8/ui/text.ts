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
import { markdown } from "./directives/directives.js";
import { Root } from "./root.js";
import { StringValue } from "../types/primitives.js";
import * as Styles from "./styles/index.js";
import { appendToAll } from "./utils/utils.js";
import { classMap } from "lit/directives/class-map.js";
import { A2UIModelProcessor } from "../data/model-processor.js";
import { styleMap } from "lit/directives/style-map.js";

@customElement("a2ui-text")
export class Text extends Root {
  @property()
  accessor text: StringValue | null = null;

  static styles = [
    Styles.all,
    css`
      :host {
        display: block;
        flex: var(--weight);
      }
    `,
  ];

  #renderText() {
    if (this.text && typeof this.text === "object") {
      if ("literalString" in this.text && this.text.literalString) {
        return html`${markdown(
          this.text.literalString,
          appendToAll(this.theme.markdown, ["ol", "ul", "li"], {})
        )}`;
      } else if ("literal" in this.text && this.text.literal !== undefined) {
        return html`${markdown(
          this.text.literal,
          appendToAll(this.theme.markdown, ["ol", "ul", "li"], {})
        )}`;
      } else if (this.text && "path" in this.text && this.text.path) {
        if (!this.processor || !this.component) {
          return html`(no model)`;
        }

        const textValue = this.processor.getData(
          this.component,
          this.text.path,
          this.surfaceId ?? A2UIModelProcessor.DEFAULT_SURFACE_ID
        );

        if (textValue === null || textValue === undefined) {
          return html`(empty)`;
        }

        return html`${markdown(
          textValue.toString(),
          appendToAll(this.theme.markdown, ["ol", "ul", "li"], {})
        )}`;
      }
    }

    return html`(empty)`;
  }

  render() {
    return html`<section
      class=${classMap(this.theme.components.Text)}
      style=${this.theme.additionalStyles?.Text
        ? styleMap(this.theme.additionalStyles?.Text)
        : nothing}
    >
      ${this.#renderText()}
    </section>`;
  }
}
