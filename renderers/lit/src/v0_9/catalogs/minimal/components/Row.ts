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
import { customElement } from "lit/decorators.js";
import { map } from "lit/directives/map.js";
import { styleMap } from "lit/directives/style-map.js";
import { RowApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { mapJustify, mapAlign } from "@a2ui/web_core/v0_9";
import { A2uiLitElement, A2uiController } from "@a2ui/lit/v0_9";

@customElement("a2ui-row")
export class A2uiRowElement extends A2uiLitElement<typeof RowApi> {
  protected createController() {
    return new A2uiController(this, RowApi);
  }

  render() {
    const props = this.controller.props;
    if (!props) return nothing;

    const childrenArray = Array.isArray(props.children) ? props.children : [];

    const styles = {
      display: "flex",
      flexDirection: "row",
      justifyContent: mapJustify(props.justify),
      alignItems: mapAlign(props.align),
      flex: props.weight !== undefined ? String(props.weight) : "initial",
    };

    return html`
      <div class="a2ui-row" style=${styleMap(styles as Record<string, string>)}>
        ${map(childrenArray, (child: any) => html`${this.renderNode(child)}`)}
      </div>
    `;
  }
}

export const A2uiRow = {
  ...RowApi,
  tagName: "a2ui-row",
};
