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
import { customElement, property } from "lit/decorators.js";
import { Root } from "./root.js";
import { StateEvent } from "../events/events.js";
import { StringValue } from "../types/primitives.js";
import * as Styles from "./styles/index.js";
import { classMap } from "lit/directives/class-map.js";
import { Action } from "../types/components.js";
import { A2UIModelProcessor } from "../data/model-processor.js";

@customElement("a2ui-button")
export class Button extends Root {
  @property()
  accessor label: StringValue | null = null;

  @property()
  accessor action: Action | null = null;

  static styles = [
    Styles.all,
    css`
      :host {
        display: block;
        flex: var(--weight);
        min-height: 0;
        overflow: auto;
      }
    `,
  ];

  #renderButton() {
    const innerRender = (label: string) => {
      return html`<button
        class=${classMap(this.theme.components.Button)}
        @click=${() => {
          if (!this.action) {
            return;
          }
          const evt = new StateEvent<"a2ui.action">({
            eventType: "a2ui.action",
            action: this.action,
            dataContextPath: this.dataContextPath,
            sourceComponentId: this.id,
          });
          this.dispatchEvent(evt);
        }}
      >
        ${label}
      </button>`;
    };

    if (this.label && typeof this.label === "object") {
      if ("literalString" in this.label && this.label.literalString) {
        return innerRender(this.label.literalString);
      } else if ("literal" in this.label && this.label.literal !== undefined) {
        return innerRender(this.label.literal);
      } else if (this.label && "path" in this.label && this.label.path) {
        if (!this.processor || !this.component) {
          return html`(no model)`;
        }

        const labelValue = this.processor.getData(
          this.component,
          this.label.path,
          this.surfaceId ?? A2UIModelProcessor.DEFAULT_SURFACE_ID
        );

        if (labelValue === null) {
          return html`Invalid label`;
        }

        if (typeof labelValue !== "string") {
          return html`Invalid label`;
        }

        return innerRender(labelValue);
      }
    }

    return nothing;
  }

  render() {
    return this.#renderButton();
  }
}
