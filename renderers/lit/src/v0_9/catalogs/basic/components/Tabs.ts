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

import { LitElement, html , nothing} from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { A2uiController } from "../../../adapter.js";
import { ComponentContext } from "@a2ui/web_core/v0_9";
import { TabsApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { renderA2uiNode } from "../../../surface/render-node.js";

@customElement("a2ui-tabs")
export class A2uiLitTabs extends LitElement {

  @property({ type: Object }) accessor context!: ComponentContext;
  private controller!: A2uiController<typeof TabsApi>;
  @state() accessor activeIndex = 0;

  willUpdate(changedProperties: Map<string, any>) {
    super.willUpdate(changedProperties);
    if (changedProperties.has('context') && this.context) {
      if (this.controller) {
        this.removeController(this.controller);
        this.controller.dispose();
      }
      this.controller = new A2uiController(this, TabsApi);
    }
  }

  render() {
    const props = this.controller.props;
    if (!props || !props.tabs) return nothing;
    return html`
      <div class="a2ui-tabs">
        <div class="a2ui-tab-headers" style="display:flex; gap: 8px; border-bottom: 1px solid #ccc; margin-bottom: 16px;">
          ${props.tabs.map((tab: any, i: number) => html`
            <button @click=${() => this.activeIndex = i} style="padding: 8px; background: ${i === this.activeIndex ? '#eee' : 'transparent'}; border: none;">
              ${tab.title}
            </button>
          `)}
        </div>
        <div class="a2ui-tab-content">
          ${props.tabs[this.activeIndex] 
            ? html`${renderA2uiNode(new ComponentContext(this.context.dataContext.surface, props.tabs[this.activeIndex].child, this.context.dataContext.path))}` 
            : ''}
        </div>
      </div>
    `;
  }
}

export const A2uiTabs = {
  ...TabsApi,
  tagName: "a2ui-tabs"
};