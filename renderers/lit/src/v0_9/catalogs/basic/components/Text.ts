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
import { consume } from "@lit/context";
import { TextApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { A2uiLitElement, A2uiController, Context } from "@a2ui/lit/v0_9";
import * as Types from "@a2ui/web_core/types/types";

import { markdown } from "../../../directives/directives.js";

@customElement("a2ui-basic-text")
export class A2uiBasicTextElement extends A2uiLitElement<typeof TextApi> {

  // Retrieve a MarkdownRenderer provided by the application.
  @consume({ context: Context.markdown, subscribe: true })
  accessor markdownRenderer: Types.MarkdownRenderer | undefined;

  protected createController() {
    return new A2uiController(this, TextApi);
  }

  render() {
    const props = this.controller.props;
    if (!props) return nothing;

    // Use props.variant to convert props.text to markdown
    let markdownText = props.text;
    switch (props.variant) {
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
      default:
        break; // body and caption.
    }

    const renderedMarkdown = markdown(markdownText, this.markdownRenderer);
    // There's not a good way to handle the caption variant in markdown, so we
    // tag it with a class so it can be tweaked via CSS.
    if (props.variant === "caption") {
      return html`<span class="a2ui-caption">${renderedMarkdown}</span>`;
    }
    return html`${renderedMarkdown}`;
  }
}

export const A2uiText = {
  ...TextApi,
  tagName: "a2ui-basic-text",
};
