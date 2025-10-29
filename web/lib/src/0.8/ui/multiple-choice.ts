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

import { html, css, PropertyValues, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { Root } from "./root.js";
import { StringValue } from "../types/primitives.js";
import { A2UIModelProcessor } from "../data/model-processor.js";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";
import { structuralStyles } from "./styles.js";

@customElement("a2ui-multiplechoice")
export class MultipleChoice extends Root {
  @property()
  accessor description: string | null = null;

  @property()
  accessor options: { label: string; value: string }[] = [];

  @property()
  accessor value: StringValue | null = null;

  static styles = [
    structuralStyles,
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

      select {
        width: 100%;
      }

      .description {
      }
    `,
  ];

  #setBoundValue(value: string[]) {
    if (!this.value || !this.processor) {
      return;
    }
    if (!("path" in this.value)) {
      return;
    }
    if (!this.value.path) {
      return;
    }

    this.processor.setData(
      this.component,
      this.value.path,
      value,
      this.surfaceId ?? A2UIModelProcessor.DEFAULT_SURFACE_ID
    );
  }

  protected willUpdate(changedProperties: PropertyValues<this>): void {
    const shouldUpdate = changedProperties.has("options");
    if (shouldUpdate) {
      this.#setBoundValue([this.options[0].value]);
    }
  }

  render() {
    return html`<section>
      <div class="description">${this.description ?? "Select an item"}</div>
      <select
        class=${classMap(this.theme.components.MultipleChoice)}
        style=${this.theme.additionalStyles?.MultipleChoice
          ? styleMap(this.theme.additionalStyles?.MultipleChoice)
          : nothing}
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
      </select>
    </section>`;
  }
}
