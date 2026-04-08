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
import { classMap } from "lit/directives/class-map.js";
import { TextFieldApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { A2uiLitElement, A2uiController } from "@a2ui/lit/v0_9";

@customElement("a2ui-basic-textfield")
export class A2uiBasicTextFieldElement extends A2uiLitElement<
  typeof TextFieldApi
> {
  protected createController() {
    return new A2uiController(this, TextFieldApi);
  }

  render() {
    const props = this.controller.props;
    if (!props) return nothing;

    const isInvalid = props.isValid === false;
    const onInput = (e: Event) =>
      props.setValue?.((e.target as HTMLInputElement).value);
    let type = "text";
    if (props.variant === "number") type = "number";
    if (props.variant === "obscured") type = "password";

    const classes = { "a2ui-textfield": true, invalid: isInvalid };

    return html`
      <div class="a2ui-textfield-container">
        ${props.label ? html`<label>${props.label}</label>` : nothing}
        ${props.variant === "longText"
          ? html`<textarea
              class=${classMap(classes)}
              .value=${props.value || ""}
              @input=${onInput}
            ></textarea>`
          : html`<input
              type=${type}
              class=${classMap(classes)}
              .value=${props.value || ""}
              @input=${onInput}
            />`}
        ${isInvalid && props.validationErrors?.length
          ? html`<div class="error">${props.validationErrors[0]}</div>`
          : nothing}
      </div>
    `;
  }
}

export const A2uiTextField = {
  ...TextFieldApi,
  tagName: "a2ui-basic-textfield",
};
