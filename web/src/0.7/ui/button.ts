/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { Root } from "./root";
import { StateEvent } from "../events/events";
import { Action, StringValue } from "../types/component-update";
import { until } from "lit/directives/until.js";
import * as Styles from "./styles";
import { classMap } from "lit/directives/class-map.js";

@customElement("gulf-button")
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
          const evt = new StateEvent<"gulf.action">({
            eventType: "gulf.action",
            action: this.action,
            dataPrefix: this.dataPrefix,
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
      } else if (this.label && "path" in this.label && this.label.path) {
        if (!this.model) {
          return html`(no model)`;
        }

        const labelValue = this.model
          ?.getDataProperty(this.label.path, this.dataPrefix)
          .then((data) => {
            if (typeof data !== "string") {
              return html`(invalid)`;
            }
            return innerRender(data);
          });
        return html`${until(labelValue)}`;
      }
    }

    return nothing;
  }

  render() {
    return this.#renderButton();
  }
}
