/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { Root } from "./root";
import { StringValue } from "../types/primitives";
import * as Styles from "./styles";
import { classMap } from "lit/directives/class-map.js";
import { ResolvedTextField } from "../types/types";

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

    this.processor.setDataByPath(
      `${this.dataContextPath}${this.text.path}`,
      value
    );
  }

  #renderField(value: string | number) {
    return html` <section>
      <input
        class=${classMap(this.theme.components.TextField)}
        autocomplete="off"
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
      } else if (this.text && "path" in this.text && this.text.path) {
        if (!this.processor) {
          return html`(no model)`;
        }

        const textValue = this.processor.getDataByPath(
          this.processor.resolvePath(this.text.path, this.dataContextPath),
          this.surfaceId
        );

        if (!textValue) {
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
