/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { Root } from "./root";
import { until } from "lit/directives/until.js";
import { StringValue } from "../types/component-update";
import * as Styles from "./styles";
import { classMap } from "lit/directives/class-map.js";

@customElement("gulf-image")
export class Image extends Root {
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

      img {
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ];

  #renderImage() {
    if (!this.url) {
      return nothing;
    }

    if (this.url && typeof this.url === "object") {
      if ("literalString" in this.url) {
        const imageUrl = this.url.literalString ?? "";
        return html`<img src=${imageUrl} />`;
      } else if (this.url && "path" in this.url && this.url.path) {
        if (!this.model) {
          return html`(no model)`;
        }

        const imageUrl = this.model
          ?.getDataProperty(this.url.path, this.dataPrefix)
          .then((data) => {
            if (typeof data !== "string") {
              return html`(invalid)`;
            }
            const imageUrl = data ?? "";
            return html`<img src=${imageUrl} />`;
          });
        return html`${until(imageUrl)}`;
      }
    }

    return html`(empty)`;
  }

  render() {
    const classes: Record<string, boolean> = {};
    for (const [id, value] of Object.entries(this.theme.components.Image)) {
      if (typeof value === "boolean") {
        classes[id] = value;
        continue;
      }

      let tagName = value;
      if (tagName.endsWith(">")) {
        tagName = tagName.replace(/\W*>$/, "").trim();
        if (
          this.parentElement &&
          this.parentElement.tagName.toLocaleLowerCase() === tagName
        ) {
          classes[id] = true;
        }
      } else {
        let parent = this.parentElement;
        while (parent) {
          if (tagName === parent.tagName.toLocaleLowerCase()) {
            classes[id] = true;
            break;
          }
          parent = parent.parentElement;
        }
      }
    }

    return html`<section class=${classMap(classes)}>
      ${this.#renderImage()}
    </section>`;
  }
}
