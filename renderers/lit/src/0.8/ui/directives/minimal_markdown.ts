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

import { html, TemplateResult } from "lit";
import {
  directive,
  Directive,
  PartInfo,
} from "lit/directive.js";

/**
 * A minimal Markdown renderer that only supports a few tags.
 *
 * Configure @a2ui/lit-markdown, or your custom Markdown renderer
 * to actually parse and render Markdown in your app.
 */
class MinimalMarkdownRendererDirective extends Directive {
  static _warned = false;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    /**
     * Warn the user in case they need actual Markdown rendering.
     */
    if (!MinimalMarkdownRendererDirective._warned) {
      console.warn("[MinimalMarkdownRendererDirective]",
        "is a placeholder Markdown renderer. Most features are not supported.\n",
        "Install `@a2ui/lit-markdown` for a fully-featured Markdown renderer.");
      MinimalMarkdownRendererDirective._warned = true;
    }
  }

  /**
   * Attempts to render some Markdown.
   *
   * Resist the urge to "improve" this method. Instead, use a more proper
   * Markdown renderer. This is just a placeholder.
   */
  render(markdown: string, _tagClassMap?: Record<string, string[]>) : TemplateResult {
    if (markdown.startsWith('# ')) {
      let classes = this.getClasses("h1", _tagClassMap);
      return html`<h1 class="${classes}">${markdown.substring(2)}</h1>`;
    }
    if (markdown.startsWith('## ')) {
      let classes = this.getClasses("h2", _tagClassMap);
      return html`<h2 class="${classes}">${markdown.substring(3)}</h2>`;
    }
    if (markdown.startsWith('### ')) {
      let classes = this.getClasses("h3", _tagClassMap);
      return html`<h3 class="${classes}">${markdown.substring(4)}</h3>`;
    }
    if (markdown.startsWith('#### ')) {
      let classes = this.getClasses("h4", _tagClassMap);
      return html`<h4 class="${classes}">${markdown.substring(5)}</h4>`;
    }
    if (markdown.startsWith('##### ')) {
      let classes = this.getClasses("h5", _tagClassMap);
      return html`<h5 class="${classes}">${markdown.substring(6)}</h5>`;
    }
    if (markdown.startsWith('*') && markdown.endsWith('*')) {
      let classes = this.getClasses("strong", _tagClassMap);
      return html`<strong class="${classes}">${markdown.substring(1, markdown.length - 1)}</strong>`;
    }
    let classes = this.getClasses("p", _tagClassMap);
    return html`<p class="${classes}">${markdown}</p>`;
  }

  /**
   * Returns a space-separated lists of clases for `tag` from `_tagClassMap`.
   * @param tag The name of the tag ("h1", "p", etc.)
   * @param _tagClassMap The class map to use.
   * @returns A space-separated list of class names.
   */
  getClasses(tag: string, _tagClassMap?: Record<string, string[]>) {
    return _tagClassMap?.[tag]?.join(' ') ?? '';
  }
}

export const minimalMarkdown = directive(MinimalMarkdownRendererDirective);
