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
import { AudioPlayerNode } from "../../core/types/types.js";

@customElement("a2ui-audioplayer")
export class Audio extends Root<AudioPlayerNode> {

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

      audio {
        display: block;
        width: 100%;
      }
    `,
  ];

  #renderAudio() {
    const url = this.node.properties.url;
    if (!url) {
      return nothing;
    }

    if (url && typeof url === "object") {
      if ("literalString" in url) {
        return html`<audio controls src=${url.literalString} />`;
      } else if ("literal" in url) {
        return html`<audio controls src=${url.literal} />`;
      } else if (url && "path" in url && url.path) {
        if (!this.processor || !this.node) {
          return html`(no processor)`;
        }

        const audioUrl = this.processor.getData(
          this.node,
          url.path,
          this.surfaceId ?? A2uiMessageProcessor.DEFAULT_SURFACE_ID
        );
        if (!audioUrl) {
          return html`Invalid audio URL`;
        }

        if (typeof audioUrl !== "string") {
          return html`Invalid audio URL`;
        }
        return html`<audio controls src=${audioUrl} />`;
      }
    }

    return html`(empty)`;
  }

  render() {
    return html`<section
      class=${classMap(this.theme.components.AudioPlayer)}
      style=${this.theme.additionalStyles?.AudioPlayer
        ? styleMap(this.theme.additionalStyles?.AudioPlayer)
        : nothing}
    >
      ${this.#renderAudio()}
    </section>`;
  }
}