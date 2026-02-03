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

import { noChange } from "lit";
import {
  Directive,
  DirectiveParameters,
  Part,
  directive,
} from "lit/directive.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { markdownRenderer } from "@a2ui/markdown-it-shared";

/**
 * A Lit directive that renders markdown to HTML.
 *
 * This directive is intended to be used by the A2UI Lit renderer to render
 * markdown to HTML.
 */
class MarkdownDirective extends Directive {
  private lastValue: string | null = null;
  private lastTagClassMap: string | null = null;

  update(_part: Part, [value, tagClassMap]: DirectiveParameters<this>) {
    if (
      this.lastValue === value &&
      JSON.stringify(tagClassMap) === this.lastTagClassMap
    ) {
      return noChange;
    }

    this.lastValue = value;
    this.lastTagClassMap = JSON.stringify(tagClassMap);
    return this.render(value, tagClassMap);
  }

  /**
   * Renders the markdown string to HTML.
   */
  render(value: string, tagClassMap?: Record<string, string[]>) {
    const htmlString = markdownRenderer.render(value, tagClassMap);
    return unsafeHTML(htmlString);
  }
}

export const markdown = directive(MarkdownDirective);
