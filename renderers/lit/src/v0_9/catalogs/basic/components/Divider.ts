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

import { html, LitElement , nothing} from "lit";
import { customElement, property } from "lit/decorators.js";
import { A2uiController } from "../../../adapter.js";
import { DividerApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { ComponentContext } from "@a2ui/web_core/v0_9";

@customElement("a2ui-divider")
export class A2uiDividerElement extends LitElement {

  @property({ type: Object }) accessor context!: ComponentContext;
  private controller!: A2uiController<typeof DividerApi>;

  willUpdate(changedProperties: Map<string, any>) {
    super.willUpdate(changedProperties);
    if (changedProperties.has('context') && this.context) {
      if (this.controller) {
        this.removeController(this.controller);
        this.controller.dispose();
      }
      this.controller = new A2uiController(this, DividerApi);
    }
  }

  render() {
    const props = this.controller.props;
    if (!props) return nothing;

    return props.axis === "vertical" 
      ? html`<div class="a2ui-divider-vertical" style="width: 1px; background: #ccc; height: 100%;"></div>`
      : html`<hr class="a2ui-divider" style="border: none; border-top: 1px solid #ccc; margin: 16px 0;" />`;
  }
}

export const A2uiDivider = {
  ...DividerApi,
  tagName: "a2ui-divider"
};