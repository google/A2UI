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
import { customElement } from "lit/decorators.js";
import { Root } from "./root.js";
import { A2uiMessageProcessor } from "../../core/a2ui_message_processor.js";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";
import { structuralStyles } from "./styles.js";
import { extractStringValue } from "../utils/utils.js";
import { MultipleChoiceNode } from "../../core/types/types.js";

@customElement("a2ui-multiplechoice")
export class MultipleChoice extends Root<MultipleChoiceNode> {

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
    const { selections } = this.node.properties;
    if (!selections || !this.processor) {
      return;
    }
    if (!("path" in selections)) {
      return;
    }
    if (!selections.path) {
      return;
    }

    this.processor.setData(
      this.node,
      selections.path,
      value,
      this.surfaceId ?? A2uiMessageProcessor.DEFAULT_SURFACE_ID
    );
  }

  protected willUpdate(changedProperties: PropertyValues<this>): void {
    const { selections } = this.node.properties;
    const shouldUpdate = changedProperties.has("node");
    if (!shouldUpdate) {
      return;
    }

    if (!this.processor || !this.node || Array.isArray(selections)) {
      return;
    }

    const selectionValue = this.processor.getData(
      this.node,
      selections.path!,
      this.surfaceId ?? A2uiMessageProcessor.DEFAULT_SURFACE_ID
    );

    if (!Array.isArray(selectionValue)) {
      return;
    }

    this.#setBoundValue(selectionValue as string[]);
  }

  render() {
    const { options } = this.node.properties;
    return html`<section class=${classMap(
      this.theme.components.MultipleChoice.container
    )}>
      <label class=${classMap(
        this.theme.components.MultipleChoice.label
      )} for="data">${"Select an item"}</div>
      <select
        name="data"
        id="data"
        class=${classMap(this.theme.components.MultipleChoice.element)}
        style=${
          this.theme.additionalStyles?.MultipleChoice
            ? styleMap(this.theme.additionalStyles?.MultipleChoice)
            : nothing
        }
        @change=${(evt: Event) => {
          if (!(evt.target instanceof HTMLSelectElement)) {
            return;
          }

          this.#setBoundValue([evt.target.value]);
        }}
      >
        ${options?.map((option) => {
          const label = extractStringValue(
            option.label,
            this.node,
            this.processor,
            this.surfaceId
          );
          return html`<option .value=${option.value}>${label}</option>`;
        })}
      </select>
    </section>`;
  }
}
