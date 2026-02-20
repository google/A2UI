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

import { html, noChange } from "lit";
import {
  Directive,
  DirectiveParameters,
  Part,
  directive,
} from "lit/directive.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import * as Types from "@a2ui/web_core/types/types";

class MarkdownDirective extends Directive {
  #lastValue: string | null = null;
  #lastTagClassMap: string | null = null;

  update(_part: Part, [value, markdownRenderer, tagClassMap]: DirectiveParameters<this>) {
    if (
      this.#lastValue === value &&
      JSON.stringify(tagClassMap) === this.#lastTagClassMap
    ) {
      return noChange;
    }

    this.#lastValue = value;
    this.#lastTagClassMap = JSON.stringify(tagClassMap);
    return this.render(value, markdownRenderer, tagClassMap);
  }

  private static defaultMarkdownWarningLogged = false;
  /**
   * Renders the markdown string to HTML using the injected markdown renderer,
   * if present. Otherwise, it returns the value wrapped in a span.
   */
  render(value: string, markdownRenderer?: Types.MarkdownRenderer, markdownOptions?: Types.MarkdownRendererOptions) {
    if (markdownRenderer) {
      // The markdown renderer returns a string, which we need to convert to a
      // template result using unsafeHTML.
      // It is the responsibilty of the markdown renderer to sanitize the HTML.
      return unsafeHTML(markdownRenderer(value, markdownOptions));
    }
    // TODO: Log once that the markdown renderer is not available.
    if (!MarkdownDirective.defaultMarkdownWarningLogged) {
      console.warn("[MarkdownDirective]",
        "can't render markdown because no markdown renderer is configured.\n",
        "Use `@a2ui/markdown-it-shared`, or your own markdown renderer.");
      MarkdownDirective.defaultMarkdownWarningLogged = true;
    }
    return html`<span class="no-markdown-renderer">${value}</span>`;
  }
}

export const markdown = directive(MarkdownDirective);
