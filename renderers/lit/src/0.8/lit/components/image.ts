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
import { customElement } from "lit/decorators.js";
import { Root } from "./root.js";
import { classMap } from "lit/directives/class-map.js";
import { A2uiMessageProcessor } from "../../core/a2ui_message_processor.js";
import { styleMap } from "lit/directives/style-map.js";
import { structuralStyles } from "./styles.js";
import { Styles } from "../../core.js";
import { ImageNode } from "../../core/types/types.js";

@customElement("a2ui-image")
export class Image extends Root<ImageNode> {

  static styles = [
    structuralStyles,
    css`
      * {
        box-sizing: border-box;
      }

      :host {
        display: block;
        flex: var(--weight);
        min-height: 0;
        overflow: auto;
      }

      img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: var(--object-fit, fill);
      }
    `,
  ];

  #renderImage() {
    const { url } = this.node.properties;
    if (!url) {
      return nothing;
    }

    const render = (url: string) => {
      return html`<img src=${url} />`;
    };

    if (url && typeof url === "object") {
      if ("literalString" in url) {
        const imageUrl = url.literalString ?? "";
        return render(imageUrl);
      } else if ("literal" in url) {
        const imageUrl = url.literal ?? "";
        return render(imageUrl);
      } else if (url && "path" in url && url.path) {
        if (!this.processor || !this.node) {
          return html`(no model)`;
        }

        const imageUrl = this.processor.getData(
          this.node,
          url.path,
          this.surfaceId ?? A2uiMessageProcessor.DEFAULT_SURFACE_ID
        );
        if (!imageUrl) {
          return html`Invalid image URL`;
        }

        if (typeof imageUrl !== "string") {
          return html`Invalid image URL`;
        }
        return render(imageUrl);
      }
    }

    return html`(empty)`;
  }

  render() {
    const { usageHint, fit } = this.node.properties;
    const classes = Styles.merge(
      this.theme.components.Image.all,
      usageHint ? this.theme.components.Image[usageHint] : {}
    );

    return html`<section
      class=${classMap(classes)}
      style=${styleMap({
        ...(this.theme.additionalStyles?.Image ?? {}),
        "--object-fit": fit ?? "fill",
      })}
    >
      ${this.#renderImage()}
    </section>`;
  }
}