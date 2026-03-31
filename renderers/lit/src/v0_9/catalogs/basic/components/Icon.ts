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
import { IconApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { A2uiLitElement, A2uiController } from "@a2ui/lit/v0_9";

@customElement("a2ui-icon")
export class A2uiIconElement extends A2uiLitElement<typeof IconApi> {
  protected createController() {
    return new A2uiController(this, IconApi);
  }

  render() {
    const props = this.controller.props;
    if (!props) return nothing;

    const name =
      typeof props.name === "string" ? props.name : (props.name as any)?.path;
    return html`<span class="material-symbols-outlined a2ui-icon"
      >${name}</span
    >`;
  }
}

export const A2uiIcon = {
  ...IconApi,
  tagName: "a2ui-icon",
};
