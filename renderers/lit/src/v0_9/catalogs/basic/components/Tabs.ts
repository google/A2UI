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
import { customElement, state } from "lit/decorators.js";
import { TabsApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { A2uiLitElement, A2uiController } from "@a2ui/lit/v0_9";

@customElement("a2ui-tabs")
export class A2uiLitTabs extends A2uiLitElement<typeof TabsApi> {
  protected createController() {
    return new A2uiController(this, TabsApi);
  }
  @state() accessor activeIndex = 0;

  render() {
    const props = this.controller.props;
    if (!props || !props.tabs) return nothing;
    return html`
      <div class="a2ui-tabs">
        <div
          class="a2ui-tab-headers"
          style="display:flex; gap: 8px; border-bottom: 1px solid #ccc; margin-bottom: 16px;"
        >
          ${props.tabs.map(
            (tab: any, i: number) => html`
              <button
                @click=${() => (this.activeIndex = i)}
                style="padding: 8px; background: ${i === this.activeIndex
                  ? "#eee"
                  : "transparent"}; border: none;"
              >
                ${tab.title}
              </button>
            `,
          )}
        </div>
        <div class="a2ui-tab-content">
          ${props.tabs[this.activeIndex]
            ? html`${this.renderNode(props.tabs[this.activeIndex].child)}`
            : nothing}
        </div>
      </div>
    `;
  }
}

export const A2uiTabs = {
  ...TabsApi,
  tagName: "a2ui-tabs",
};
