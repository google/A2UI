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
import { markdown } from "../directives/directives.js";
import { Root } from "./root.js";
import { classMap } from "lit/directives/class-map.js";
import { A2uiMessageProcessor } from "../../core/a2ui_message_processor.js";
import { styleMap } from "lit/directives/style-map.js";
import { structuralStyles } from "./styles.js";
import { Styles } from "../../core.js";
import { TextNode, Theme } from "../../core/types/types.js";

interface HintedStyles {
  h1: Record<string, string>;
  h2: Record<string, string>;
  h3: Record<string, string>;
  h4: Record<string, string>;
  h5: Record<string, string>;
  body: Record<string, string>;
  caption: Record<string, string>;
}

@customElement("a2ui-text")
export class Text extends Root<TextNode> {

  static styles = [
    structuralStyles,
    css`
      :host {
        display: block;
        flex: var(--weight);
      }

      h1,
      h2,
      h3,
      h4,
      h5 {
        line-height: inherit;
        font: inherit;
      }
    `,
  ];

  #renderText() {
    let textValue: string | null | undefined = null;
    const { text } = this.node.properties;

    if (text && typeof text === "object") {
      if ("literalString" in text && text.literalString) {
        textValue = text.literalString;
      } else if ("literal" in text && text.literal !== undefined) {
        textValue = text.literal;
      } else if (text && "path" in text && text.path) {
        if (!this.processor || !this.node) {
          return html`(no model)`;
        }

        const value = this.processor.getData(
          this.node,
          text.path,
          this.surfaceId ?? A2uiMessageProcessor.DEFAULT_SURFACE_ID
        );

        if (value !== null && value !== undefined) {
          textValue = value.toString();
        }
      }
    }

    if (textValue === null || textValue === undefined) {
      return html`(empty)`;
    }

    let markdownText = textValue;
    switch (this.node.properties.usageHint) {
      case "h1":
        markdownText = `# ${markdownText}`;
        break;
      case "h2":
        markdownText = `## ${markdownText}`;
        break;
      case "h3":
        markdownText = `### ${markdownText}`;
        break;
      case "h4":
        markdownText = `#### ${markdownText}`;
        break;
      case "h5":
        markdownText = `##### ${markdownText}`;
        break;
      case "caption":
        markdownText = `*${markdownText}*`;
        break;
      default:
        break; // Body.
    }

    return html`${markdown(
      markdownText,
      Styles.appendToAll(this.theme.markdown, ["ol", "ul", "li"], {})
    )}`;
  }

  #areHintedStyles(styles: unknown): styles is HintedStyles {
    if (typeof styles !== "object") return false;
    if (Array.isArray(styles)) return false;
    if (!styles) return false;

    const expected = ["h1", "h2", "h3", "h4", "h5", "h6", "caption", "body"];
    return expected.every((v) => v in styles);
  }

  #getAdditionalStyles() {
    let additionalStyles: Record<string, string> = {};
    const styles = this.theme.additionalStyles?.Text;
    if (!styles) return additionalStyles;

    if (this.#areHintedStyles(styles)) {
      const hint = this.node.properties.usageHint ?? "body";
      additionalStyles = styles[hint] as Record<string, string>;
    } else {
      additionalStyles = styles;
    }

    return additionalStyles;
  }

  render() {
    const { usageHint } = this.node.properties;
    const classes = Styles.merge(
      this.theme.components.Text.all,
      usageHint ? this.theme.components.Text[usageHint] : {}
    );

    return html`<section
      class=${classMap(classes)}
      style=${this.theme.additionalStyles?.Text
        ? styleMap(this.#getAdditionalStyles())
        : nothing}
    >
      ${this.#renderText()}
    </section>`;
  }
}