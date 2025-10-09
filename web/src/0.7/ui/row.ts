/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { Root } from "./root";
import * as Styles from "./styles";
import { classMap } from "lit/directives/class-map.js";
import { Row as RowType } from "../types/component-update";

@customElement("gulf-row")
export class Row extends Root {
  @property({ reflect: true, type: String })
  accessor alignment: RowType["alignment"] = "stretch";

  @property({ reflect: true, type: String })
  accessor distribution: RowType["distribution"] = "start";

  static styles = [
    Styles.all,
    css`
      :host {
        display: block;
        flex: var(--weight);
      }

      section {
        display: flex;
        flex-direction: row;
      }

      :host[alignment="start"] section {
        align-items: start;
      }

      :host[alignment="center"] section {
        align-items: center;
      }

      :host[alignment="end"] section {
        align-items: end;
      }

      :host[alignment="stretch"] section {
        align-items: stretch;
      }

      :host[distribution="start"] section {
        justify-content: start;
      }

      :host[distribution="center"] section {
        justify-content: center;
      }

      :host[distribution="end"] section {
        justify-content: end;
      }

      :host[distribution="spaceBetween"] section {
        justify-content: space-between;
      }

      :host[distribution="spaceAround"] section {
        justify-content: space-around;
      }

      :host[distribution="spaceEvenly"] section {
        justify-content: space-evenly;
      }
    `,
  ];

  render() {
    return html`<section class=${classMap(this.theme.components.Row)}>
      <slot></slot>
    </section>`;
  }
}
