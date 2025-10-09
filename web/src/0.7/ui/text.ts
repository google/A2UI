/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { markdown } from "../directives/directives";
import { Root } from "./root";
import { until } from "lit/directives/until.js";
import { StringValue } from "../types/component-update";
import * as Styles from "./styles";
import { appendToAll } from "./utils/utils";
import { classMap } from "lit/directives/class-map.js";

@customElement("gulf-text")
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
      } else if (this.text && "path" in this.text && this.text.path) {
        if (!this.model) {
          return html`(no model)`;
        }

        const textValue = this.model
          ?.getDataProperty(this.text.path, this.dataPrefix)
          .then((data) => {
            if (typeof data !== "string") {
              return html`(invalid)`;
            }
            return html`${markdown(
              data,
              appendToAll(this.theme.markdown, ["ol", "ul", "li"], {})
            )}`;
          });
        return html`${until(textValue)}`;
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
