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
import { customElement, property, query } from "lit/decorators.js";
import { A2uiController } from "../../../adapter.js";
import { ComponentContext } from "@a2ui/web_core/v0_9";
import { ModalApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { renderA2uiNode } from "../../../surface/render-node.js";

@customElement("a2ui-modal")
export class A2uiLitModal extends LitElement {

  @property({ type: Object }) accessor context!: ComponentContext;
  private controller!: A2uiController<typeof ModalApi>;
  @query("dialog") accessor dialog!: HTMLDialogElement;

  connectedCallback() {
    super.connectedCallback();
    this.controller = new A2uiController(this, ModalApi);
  }

  render() {
    const props = this.controller.props;
    if (!props) return nothing;

    return html`
      <div @click=${() => this.dialog?.showModal()}>
        ${props.trigger ? html`${renderA2uiNode(new ComponentContext(this.context.dataContext.surface, props.trigger, this.context.dataContext.path))}` : ''}
      </div>
      <dialog class="a2ui-modal" style="border: 1px solid #ccc; border-radius: 8px; padding: 24px; min-width: 300px;">
        <form method="dialog" style="text-align: right;"><button>×</button></form>
        ${props.content ? html`${renderA2uiNode(new ComponentContext(this.context.dataContext.surface, props.content, this.context.dataContext.path))}` : ''}
      </dialog>
    `;
  }
}

export const A2uiModal = {
  ...ModalApi,
  tagName: "a2ui-modal"
};