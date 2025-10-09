/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { Root } from "./root";
import {
  NumberValue,
  StringValue,
  TextField as TextFieldDefinition,
} from "../types/component-update";
import { until } from "lit/directives/until.js";
import * as Styles from "./styles";

@customElement("gulf-slider")
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
  accessor inputType: TextFieldDefinition["type"] | null = null;

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
    if (!this.value || !this.model) {
      return;
    }

    if (!("path" in this.value)) {
      return;
    }

    if (!this.value.path) {
      return;
    }

    this.model.setDataProperty(this.value.path, this.dataPrefix, value);
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
        if (!this.model) {
          return html`(no model)`;
        }

        const textValue = this.model
          ?.getDataProperty(this.value.path, this.dataPrefix)
          .then((data) => {
            if (typeof data !== "string" && typeof data !== "number") {
              return html`(invalid)`;
            }
            return this.#renderField(data);
          });
        return html`${until(textValue)}`;
      }
    }

    return nothing;
  }
}
