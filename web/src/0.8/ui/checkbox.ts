/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { Root } from "./root";
import { StringValue, BooleanValue } from "../types/primitives";
import * as Styles from "./styles";
import { classMap } from "lit/directives/class-map.js";

@customElement("a2ui-checkbox")
export class Checkbox extends Root {
  @property()
  accessor value: BooleanValue | null = null;

  @property()
  accessor label: StringValue | null = null;

  static styles = [
    Styles.all,
    css`
      * {
        box-sizing: border-box;
      }

      :host {
        display: block;
        flex: var(--weight);
        min-height: 0;
        overflow: auto;
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

  #renderField(value: boolean | number) {
    return html` <section
      class=${classMap(this.theme.components.CheckBox.container)}
    >
      <input
        class=${classMap(this.theme.components.CheckBox.element)}
        autocomplete="off"
        @input=${(evt: Event) => {
          if (!(evt.target instanceof HTMLInputElement)) {
            return;
          }

          this.#setBoundValue(evt.target.value);
        }}
        id="data"
        type="checkbox"
        .value=${value}
      />
      <label class=${classMap(this.theme.components.CheckBox.label)} for="data"
        >${this.label?.literalString}</label
      >
    </section>`;
  }

  render() {
    if (this.value && typeof this.value === "object") {
      if ("literalBoolean" in this.value && this.value.literalBoolean) {
        return this.#renderField(this.value.literalBoolean);
      } else if (this.value && "path" in this.value && this.value.path) {
        if (!this.processor) {
          return html`(no model)`;
        }

        const textValue = this.processor.getDataByPath(
          this.processor.resolvePath(this.value.path, this.dataContextPath),
          this.surfaceId
        );

        if (!textValue) {
          return html`Invalid label`;
        }

        if (typeof textValue !== "boolean") {
          return html`Invalid label`;
        }

        return this.#renderField(textValue);
      }
    }

    return nothing;
  }
}
