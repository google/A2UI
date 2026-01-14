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
import { styleMap } from "lit/directives/style-map.js";
import { structuralStyles } from "./styles.js";
import { VideoNode } from "../../core/types/types.js";
import { A2uiMessageProcessor } from "../../core/a2ui_message_processor.js";

@customElement("a2ui-video")
export class Video extends Root<VideoNode> {

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

      video {
        display: block;
        width: 100%;
      }
    `,
  ];

  #renderVideo() {
    const { url } = this.node.properties;
    if (!url) {
      return nothing;
    }

    if (url && typeof url === "object") {
      if ("literalString" in url) {
        return html`<video controls src=${url.literalString} />`;
      } else if ("literal" in url) {
        return html`<video controls src=${url.literal} />`;
      } else if (url && "path" in url && url.path) {
        if (!this.processor || !this.node) {
          return html`(no processor)`;
        }

        const videoUrl = this.processor.getData(
          this.node,
          url.path,
          this.surfaceId ?? A2uiMessageProcessor.DEFAULT_SURFACE_ID
        );
        if (!videoUrl) {
          return html`Invalid video URL`;
        }

        if (typeof videoUrl !== "string") {
          return html`Invalid video URL`;
        }
        return html`<video controls src=${videoUrl} />`;
      }
    }

    return html`(empty)`;
  }

  render() {
    return html`<section
      class=${classMap(this.theme.components.Video)}
      style=${this.theme.additionalStyles?.Video
        ? styleMap(this.theme.additionalStyles?.Video)
        : nothing}
    >
      ${this.#renderVideo()}
    </section>`;
  }
}