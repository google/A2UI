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

import { html, nothing, css, PropertyValues } from "lit";
import { customElement } from "lit/decorators.js";
import { map } from "lit/directives/map.js";
import { styleMap } from "lit/directives/style-map.js";
import { ColumnApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { BasicCatalogA2uiLitElement } from "../../basic-catalog-a2ui-lit-element.js";
import { A2uiController } from "@a2ui/lit/v0_9";

function mapJustify(justify: string | undefined): string {
  switch (justify) {
    case "start":
      return "flex-start";
    case "center":
      return "center";
    case "end":
      return "flex-end";
    case "spaceBetween":
      return "space-between";
    case "spaceAround":
      return "space-around";
    case "spaceEvenly":
      return "space-evenly";
    case "stretch":
      return "stretch";
    default:
      return "flex-start";
  }
}

function mapAlign(align: string | undefined): string {
  switch (align) {
    case "start":
      return "flex-start";
    case "center":
      return "center";
    case "end":
      return "flex-end";
    case "stretch":
      return "stretch";
    default:
      return "stretch";
  }
}

@customElement("a2ui-column")
export class A2uiColumnElement extends BasicCatalogA2uiLitElement<typeof ColumnApi> {
  /**
   * The styles of the column can be customized by redefining the following
   * CSS variables:
   *
   * - `--a2ui-column-gap`: The gap between items in the column. Defaults to `--a2ui-spacing-m`.
   */
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--a2ui-column-gap, var(--a2ui-spacing-m));
    }
    :host > * {
      display: flex;
    }
  `;

  protected createController() {
    return new A2uiController(this, ColumnApi);
  }

  updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    const props = this.controller.props;
    if (props) {
      this.style.flex =
        props.weight !== undefined ? String(props.weight) : "initial";
      this.style.justifyContent = mapJustify(props.justify);
      this.style.alignItems = mapAlign(props.align);
    }
  }

  render() {
    const props = this.controller.props;
    if (!props) return nothing;

    const childrenArray = Array.isArray(props.children) ? props.children : [];

    return html`
      ${map(childrenArray, (child: any) => html`${this.renderNode(child)}`)}
    `;
  }
}

export const A2uiColumn = {
  ...ColumnApi,
  tagName: "a2ui-column",
};
