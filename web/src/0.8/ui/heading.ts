/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { Root } from "./root";
import { StringValue } from "../types/primitives";
import * as Styles from "./styles";
import { classMap } from "lit/directives/class-map.js";

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

        return html`<h1 class=${classMap(this.theme.components.Heading)}>
          ${textValue}
        </h1>`;
      }
    }

    return html`(empty)`;
  }
}
