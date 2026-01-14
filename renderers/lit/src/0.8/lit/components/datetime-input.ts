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
import { customElement } from "lit/decorators.js";
import { Root } from "./root.js";
import { classMap } from "lit/directives/class-map.js";
import { A2uiMessageProcessor } from "../../core/a2ui_message_processor.js";
import { styleMap } from "lit/directives/style-map.js";
import { structuralStyles } from "./styles.js";
import { DateTimeInputNode } from "../../core/types/types.js";

@customElement("a2ui-datetimeinput")
export class DateTimeInput extends Root<DateTimeInputNode> {

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

      input {
        display: block;
        border-radius: 8px;
        padding: 8px;
        border: 1px solid #ccc;
        width: 100%;
      }
    `,
  ];

  #setBoundValue(value: string) {
    const { value: valueProp } = this.node.properties;
    if (!valueProp || !this.processor) {
      return;
    }

    if (!("path" in valueProp)) {
      return;
    }

    if (!valueProp.path) {
      return;
    }

    this.processor.setData(
      this.node,
      valueProp.path,
      value,
      this.surfaceId ?? A2uiMessageProcessor.DEFAULT_SURFACE_ID
    );
  }

  #renderField(value: string) {
    return html`<section
      class=${classMap(this.theme.components.DateTimeInput.container)}
    >
      <label
        for="data"
        class=${classMap(this.theme.components.DateTimeInput.label)}
        >${this.#getPlaceholderText()}</label
      >
      <input
        autocomplete="off"
        class=${classMap(this.theme.components.DateTimeInput.element)}
        style=${this.theme.additionalStyles?.DateTimeInput
          ? styleMap(this.theme.additionalStyles?.DateTimeInput)
          : nothing}
        @input=${(evt: Event) => {
          if (!(evt.target instanceof HTMLInputElement)) {
            return;
          }

          this.#setBoundValue(evt.target.value);
        }}
        id="data"
        name="data"
        .value=${this.#formatInputValue(value)}
        .placeholder=${this.#getPlaceholderText()}
        .type=${this.#getInputType()}
      />
    </section>`;
  }

  #getInputType() {
    const { enableDate, enableTime } = this.node.properties;
    if (enableDate && enableTime) {
      return "datetime-local";
    } else if (enableDate) {
      return "date";
    } else if (enableTime) {
      return "time";
    }

    return "datetime-local";
  }

  #formatInputValue(value: string) {
    const inputType = this.#getInputType();
    const date = value ? new Date(value) : null;

    if (!date || isNaN(date.getTime())) {
      return "";
    }

    const year = this.#padNumber(date.getFullYear());
    const month = this.#padNumber(date.getMonth());
    const day = this.#padNumber(date.getDate());
    const hours = this.#padNumber(date.getHours());
    const minutes = this.#padNumber(date.getMinutes());

    if (inputType === "date") {
      return `${year}-${month}-${day}`;
    } else if (inputType === "time") {
      return `${hours}:${minutes}`;
    }

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  #padNumber(value: number) {
    return value.toString().padStart(2, "0");
  }

  #getPlaceholderText() {
    const inputType = this.#getInputType();

    if (inputType === "date") {
      return "Date";
    } else if (inputType === "time") {
      return "Time";
    }

    return "Date & Time";
  }

  render() {
    const { value } = this.node.properties;
    if (value && typeof value === "object") {
      if ("literalString" in value && value.literalString) {
        return this.#renderField(value.literalString);
      } else if ("literal" in value && value.literal !== undefined) {
        return this.#renderField(value.literal);
      } else if (value && "path" in value && value.path) {
        if (!this.processor || !this.node) {
          return html`(no model)`;
        }

        const textValue = this.processor.getData(
          this.node,
          value.path,
          this.surfaceId ?? A2uiMessageProcessor.DEFAULT_SURFACE_ID
        );
        if (typeof textValue !== "string") {
          return html`(invalid)`;
        }

        return this.#renderField(textValue);
      }
    }

    return nothing;
  }
}
