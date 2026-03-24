/*
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { html, nothing } from "lit";
import { customElement } from "lit/decorators.js";
import { DateTimeInputApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { A2uiLitElement, A2uiController } from "@a2ui/lit/v0_9";

@customElement("a2ui-datetimeinput")
export class A2uiDateTimeInputElement extends A2uiLitElement<
  typeof DateTimeInputApi
> {
  protected createController() {
    return new A2uiController(this, DateTimeInputApi);
  }

  render() {
    const props = this.controller.props;
    if (!props) return nothing;

    const type =
      props.enableDate && props.enableTime
        ? "datetime-local"
        : props.enableDate
          ? "date"
          : "time";
    return html`
      <div class="a2ui-datetime">
        ${props.label ? html`<label>${props.label}</label>` : nothing}
        <input
          type=${type}
          .value=${props.value || ""}
          @input=${(e: Event) =>
            props.setValue?.((e.target as HTMLInputElement).value)}
        />
      </div>
    `;
  }
}

export const A2uiDateTimeInput = {
  ...DateTimeInputApi,
  tagName: "a2ui-datetimeinput",
};
