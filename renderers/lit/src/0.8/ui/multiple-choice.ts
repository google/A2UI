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

import { html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { Root } from "./root.js";
import { StringValue } from "../types/primitives.js";
import { A2uiMessageProcessor } from "../data/model-processor.js";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";
import { structuralStyles } from "./styles.js";
import { extractStringValue } from "./utils/utils.js";
import { ResolvedMultipleChoice } from "../types/types";

@customElement("a2ui-multiplechoice")
export class MultipleChoice extends Root {
  @property()
  accessor description: string | null = null;

  @property()
  accessor options: { label: StringValue; value: string }[] = [];

  @property()
  accessor selections: ResolvedMultipleChoice["selections"] | StringValue | null =
    null;

  @property({ type: Number })
  accessor maxAllowedSelections: number | null = null;

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
    if (!this.selections || !this.processor) {
      return;
    }
    if (!("path" in this.selections)) {
      return;
    }
    if (!this.selections.path) {
      return;
    }

    this.processor.setData(
      this.component,
      this.selections.path,
      value,
      this.surfaceId ?? A2uiMessageProcessor.DEFAULT_SURFACE_ID
    );
  }

  #resolveSelections(): string[] {
    if (!this.selections || typeof this.selections !== "object") {
      return [];
    }

    if ("literalArray" in this.selections) {
      return Array.isArray(this.selections.literalArray)
        ? this.selections.literalArray
        : [];
    }

    if ("literalString" in this.selections) {
      return this.selections.literalString
        ? [this.selections.literalString]
        : [];
    }

    if ("literal" in this.selections) {
      return this.selections.literal !== undefined
        ? [this.selections.literal]
        : [];
    }

    if ("path" in this.selections && this.selections.path) {
      if (!this.processor || !this.component) {
        return [];
      }

      const selectionValue = this.processor.getData(
        this.component,
        this.selections.path,
        this.surfaceId ?? A2uiMessageProcessor.DEFAULT_SURFACE_ID
      );

      if (Array.isArray(selectionValue)) {
        return selectionValue.filter(
          (value): value is string => typeof value === "string"
        );
      }

      return typeof selectionValue === "string" ? [selectionValue] : [];
    }

    return [];
  }

  #getMaxSelections(): number | null {
    if (typeof this.maxAllowedSelections !== "number") {
      return null;
    }

    return this.maxAllowedSelections > 0 ? this.maxAllowedSelections : 0;
  }

  #isMultiple(selectedValues: string[]): boolean {
    const maxSelections = this.#getMaxSelections();
    return maxSelections ? maxSelections > 1 : selectedValues.length > 1;
  }

  #handleChange(event: Event, allowMultiple: boolean) {
    if (!(event.target instanceof HTMLSelectElement)) {
      return;
    }

    const selectedValues = allowMultiple
      ? Array.from(event.target.selectedOptions).map((option) => option.value)
      : [event.target.value];
    const maxSelections = this.#getMaxSelections();
    const nextSelections =
      maxSelections !== null && selectedValues.length > maxSelections
        ? selectedValues.slice(0, maxSelections)
        : selectedValues;

    if (
      allowMultiple &&
      nextSelections.length !== selectedValues.length &&
      event.target.options
    ) {
      const allowed = new Set(nextSelections);
      for (const option of Array.from(event.target.options)) {
        option.selected = allowed.has(option.value);
      }
    }

    this.#setBoundValue(nextSelections);
  }

  render() {
    const selectedValues = this.#resolveSelections();
    const allowMultiple = this.#isMultiple(selectedValues);
    const selectedSet = new Set(selectedValues);

    return html`<section class=${classMap(
      this.theme.components.MultipleChoice.container
    )}>
      <label class=${classMap(
        this.theme.components.MultipleChoice.label
      )} for="data">${this.description ?? "Select an item"}</label>
      <select
        name="data"
        id="data"
        ?multiple=${allowMultiple}
        class=${classMap(this.theme.components.MultipleChoice.element)}
        style=${
          this.theme.additionalStyles?.MultipleChoice
            ? styleMap(this.theme.additionalStyles?.MultipleChoice)
            : nothing
        }
        @change=${(evt: Event) => this.#handleChange(evt, allowMultiple)}
      >
        ${this.options.map((option) => {
          const label = extractStringValue(
            option.label,
            this.component,
            this.processor,
            this.surfaceId
          );
          return html`<option
            value=${option.value}
            ?selected=${selectedSet.has(option.value)}
          >
            ${label}
          </option>`;
        })}
      </select>
    </section>`;
  }
}
