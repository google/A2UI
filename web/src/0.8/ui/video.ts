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

@customElement("a2ui-video")
export class Video extends Root {
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
      }

      video {
        display: block;
      }
    `,
  ];

  render() {
    if (!this.url) {
      return nothing;
    }

    if (this.url && typeof this.url === "object") {
      if ("literalString" in this.url) {
        return html`<video src=${this.url.literalString} />`;
      } else if (this.url && "path" in this.url && this.url.path) {
        if (!this.processor) {
          return html`(no model processor)`;
        }

        const videoUrl = this.processor.getDataByPath(
          this.processor.resolvePath(this.url.path, this.dataContextPath),
          this.surfaceId
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
}
