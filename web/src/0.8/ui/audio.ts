/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { Root } from "./root";
import { StringValue } from "../types/primitives";
import * as Styles from "./styles";
import { classMap } from "lit/directives/class-map.js";

@customElement("a2ui-audioplayer")
export class Audio extends Root {
  @property()
  accessor url: StringValue | null = null;

  static styles = [
    Styles.all,
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
    if (!this.url) {
      return nothing;
    }

    if (this.url && typeof this.url === "object") {
      if ("literalString" in this.url) {
        return html`<audio controls src=${this.url.literalString} />`;
      } else if (this.url && "path" in this.url && this.url.path) {
        if (!this.processor) {
          return html`(no processor)`;
        }

        const audioUrl = this.processor.getDataByPath(
          this.processor.resolvePath(this.url.path, this.dataContextPath),
          this.surfaceId
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
    return html`<section class=${classMap(this.theme.components.AudioPlayer)}>
      ${this.#renderAudio()}
    </section>`;
  }
}
