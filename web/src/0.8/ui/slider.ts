/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { Root } from "./root";
import { NumberValue, StringValue } from "../types/primitives";
import * as Styles from "./styles";
import { ResolvedTextField } from "../types/types";

@customElement("a2ui-slider")
export class Slider extends Root {
  @property()
  accessor value: NumberValue | null = null;

  @property()
  accessor minValue = 0;

  @property()
  accessor maxValue = 0;

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
      }
    `,
  ];

  #setBoundValue(value: string) {
    if (!this.value || !this.processor) {
      return;
    }

    if (!("path" in this.value)) {
      return;
    }

    if (!this.value.path) {
      return;
    }

    this.processor.setDataByPath(
      `${this.dataContextPath}${this.value.path}`,
      value
    );
  }

  #renderField(value: string | number) {
    return html`<div class="description">
        ${this.label?.literalString ?? ""}
      </div>
      <div>
        <input
          autocomplete="off"
          @input=${(evt: Event) => {
            if (!(evt.target instanceof HTMLInputElement)) {
              return;
            }

            this.#setBoundValue(evt.target.value);
          }}
          id="data"
          .value=${value}
          type="range"
          min=${this.minValue ?? "0"}
          max=${this.maxValue ?? "0"}
        />
      </div>`;
  }

  render() {
    if (this.value && typeof this.value === "object") {
      if ("literalNumber" in this.value && this.value.literalNumber) {
        return this.#renderField(this.value.literalNumber);
      } else if (this.value && "path" in this.value && this.value.path) {
        if (!this.processor) {
          return html`(no processor)`;
        }

        const textValue = this.processor.getDataByPath(
          this.processor.resolvePath(this.value.path, this.dataContextPath),
          this.surfaceId
        );

        if (!textValue) {
          return html`Invalid value`;
        }

        if (typeof textValue !== "string") {
          return html`Invalid value`;
        }

        return this.#renderField(textValue);
      }
    }

    return nothing;
  }
}
