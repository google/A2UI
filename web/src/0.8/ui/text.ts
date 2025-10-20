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
import { html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { markdown } from "./directives/directives";
import { Root } from "./root";
import { StringValue } from "../types/primitives";
import * as Styles from "./styles";
import { appendToAll } from "./utils/utils";
import { classMap } from "lit/directives/class-map.js";

@customElement("a2ui-text")
export class Text extends Root {
  @property()
  accessor text: StringValue | null = null;

  static styles = [
    Styles.all,
    css`
      :host {
        display: block;
        flex-grow: 0;
        flex-shrink: 0;
        flex-basis: auto;
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
      } else if (this.text && "path" in this.text && this.text.path) {
        if (!this.processor) {
          return html`(no model)`;
        }

        const textValue = this.processor.getDataByPath(
          this.processor.resolvePath(this.text.path, this.dataContextPath),
          this.surfaceId
        );
        if (typeof textValue !== "string") {
          return html`(invalid)`;
        }

        return html`${markdown(
          textValue,
          appendToAll(this.theme.markdown, ["ol", "ul", "li"], {})
        )}`;
      }
    }

    return html`(empty)`;
  }

  render() {
    return html`<section class=${classMap(this.theme.components.Text)}>
      ${this.#renderText()}
    </section>`;
  }
}
