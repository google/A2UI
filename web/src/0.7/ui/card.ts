/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { html, css, nothing } from "lit";
import { customElement } from "lit/decorators.js";
import { Root } from "./root";
import * as Styles from "./styles";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";

@customElement("gulf-card")
export class Card extends Root {
  static styles = [
    Styles.all,
    css`
      * {
        box-sizing: border-box;
      }

      :host {
        display: block;
        flex: var(--weight);
      }

      section {
        display: block;
      }
    `,
  ];

  render() {
    return html` <section
      class=${classMap(this.theme.components.Card)}
      style=${this.theme.additionalStyles?.Card
        ? styleMap(this.theme.additionalStyles?.Card)
        : nothing}
    >
      <slot></slot>
    </section>`;
  }
}
