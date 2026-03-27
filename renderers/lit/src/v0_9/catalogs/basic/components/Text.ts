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
import { TextApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { A2uiLitElement, A2uiController } from "@a2ui/lit/v0_9";

@customElement("a2ui-basic-text")
export class A2uiBasicTextElement extends A2uiLitElement<typeof TextApi> {
  protected createController() {
    return new A2uiController(this, TextApi);
  }

  render() {
    const props = this.controller.props;
    if (!props) return nothing;

    const variant = props.variant ?? "body";
    switch (variant) {
      case "h1":
        return html`<h1>${props.text}</h1>`;
      case "h2":
        return html`<h2>${props.text}</h2>`;
      case "h3":
        return html`<h3>${props.text}</h3>`;
      case "h4":
        return html`<h4>${props.text}</h4>`;
      case "h5":
        return html`<h5>${props.text}</h5>`;
      case "caption":
        return html`<span class="a2ui-caption">${props.text}</span>`;
      default:
        return html`<p>${props.text}</p>`;
    }
  }
}

export const A2uiText = {
  ...TextApi,
  tagName: "a2ui-basic-text",
};
