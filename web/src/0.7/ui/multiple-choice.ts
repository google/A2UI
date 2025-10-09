/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { html, css, PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";
import { Root } from "./root";
import { StringValue } from "../types/component-update";
import * as Styles from "./styles";

@customElement("gulf-multiplechoice")
export class MultipleChoice extends Root {
  @property()
  accessor description: string | null = null;

  @property()
  accessor options: { label: string; value: string }[] = [];

  @property()
  accessor value: StringValue | null = null;

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

      select {
        width: 100%;
      }

      .description {
      }
    `,
  ];

  #setBoundValue(value: string[]) {
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

  protected willUpdate(changedProperties: PropertyValues<this>): void {
    const shouldUpdate =
      changedProperties.has("options") || changedProperties.has("model");
    if (shouldUpdate) {
      this.#setBoundValue([this.options[0].value]);
    }
  }

  render() {
    return html` <div class="description">
        ${this.description ?? "Select an item"}
      </div>
      <select
        @change=${(evt: Event) => {
          if (!this.value) {
            return;
          }

          if (!(evt.target instanceof HTMLSelectElement)) {
            return;
          }

          this.#setBoundValue([evt.target.value]);
        }}
      >
        ${this.options.map(
          (option) => html`<option ${option.value}>${option.label}</option>`
        )}
      </select>`;
  }
}
