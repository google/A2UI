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
import { ChoicePickerApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { ComponentContext } from "@a2ui/web_core/v0_9";

@customElement("a2ui-choicepicker")
export class A2uiChoicePickerElement extends LitElement {

  @property({ type: Object }) accessor context!: ComponentContext;
  private controller!: A2uiController<typeof ChoicePickerApi>;

  willUpdate(changedProperties: Map<string, any>) {
    super.willUpdate(changedProperties);
    if (changedProperties.has('context') && this.context) {
      if (this.controller) {
        this.removeController(this.controller);
        this.controller.dispose();
      }
      this.controller = new A2uiController(this, ChoicePickerApi);
    }
  }

  render() {
    const props = this.controller.props;
    if (!props) return nothing;

    const selected = Array.isArray(props.value) ? props.value : [];
    const isMulti = props.variant === "multipleSelection";
    
    const toggle = (val: string) => {
      if (!props.setValue) return;
      if (isMulti) {
        if (selected.includes(val)) props.setValue(selected.filter((v: string) => v !== val));
        else props.setValue([...selected, val]);
      } else {
        props.setValue([val]);
      }
    };

    return html`
      <div class="a2ui-choicepicker">
        ${props.label ? html`<label>${props.label}</label>` : ""}
        <div class="options">
          ${props.options?.map((opt: any) => html`
            <label>
              <input 
                type=${isMulti ? "checkbox" : "radio"} 
                .checked=${selected.includes(opt.value)} 
                @change=${() => toggle(opt.value)} 
              />
              ${opt.label}
            </label>
          `)}
        </div>
      </div>
    `;
  }
}

export const A2uiChoicePicker = {
  ...ChoicePickerApi,
  tagName: "a2ui-choicepicker"
};