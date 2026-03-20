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
import { styleMap } from "lit/directives/style-map.js";
import { A2uiController } from "../../../adapter.js";
import { ImageApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { ComponentContext } from "@a2ui/web_core/v0_9";

@customElement("a2ui-image")
export class A2uiImageElement extends LitElement {

  @property({ type: Object }) accessor context!: ComponentContext;
  private controller!: A2uiController<typeof ImageApi>;

  willUpdate(changedProperties: Map<string, any>) {
    super.willUpdate(changedProperties);
    if (changedProperties.has('context') && this.context) {
      if (this.controller) {
        this.removeController(this.controller);
        this.controller.dispose();
      }
      this.controller = new A2uiController(this, ImageApi);
    }
  }

  render() {
    const props = this.controller.props;
    if (!props) return nothing;

    const styles = { objectFit: props.fit || "fill", width: "100%" };
    return html`<img src=${props.url} class=${"a2ui-image " + (props.variant || "")} style=${styleMap(styles)} />`;
  }
}

export const A2uiImage = {
  ...ImageApi,
  tagName: "a2ui-image"
};