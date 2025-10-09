/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { Root } from "./root";
import { until } from "lit/directives/until.js";
import { StringValue } from "../types/component-update";
import * as Styles from "./styles";
import { classMap } from "lit/directives/class-map.js";

@customElement("gulf-heading")
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
        flex: var(--weight);
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
            return html`<h1>${data}</h1>`;
          });
        return html`${until(textValue)}`;
      }
    }

    return html`(empty)`;
  }
}
