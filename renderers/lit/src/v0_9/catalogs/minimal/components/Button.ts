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
import { ButtonApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { A2uiLitElement, A2uiController } from "@a2ui/lit/v0_9";

@customElement("a2ui-button")
export class A2uiButtonElement extends A2uiLitElement<typeof ButtonApi> {
  protected createController() {
    return new A2uiController(this, ButtonApi);
  }

  render() {
    const props = this.controller.props;
    if (!props) return nothing;

    const isDisabled = props.isValid === false;

    const onClick = () => {
      if (!isDisabled && props.action) {
        props.action();
      }
    };

    const classes = {
      "a2ui-button": true,
      "a2ui-button-primary": props.variant === "primary",
      "a2ui-button-borderless": props.variant === "borderless",
    };

    return html`
      <button
        class=${classMap(classes)}
        @click=${onClick}
        ?disabled=${isDisabled}
      >
        ${props.child ? html`${this.renderNode(props.child)}` : nothing}
      </button>
    `;
  }
}

export const A2uiButton = {
  ...ButtonApi,
  tagName: "a2ui-button",
};
