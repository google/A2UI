/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { noChange } from "lit";
import {
  Directive,
  DirectiveParameters,
  Part,
  directive,
} from "lit/directive.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import MarkdownIt from "markdown-it";
import { RenderRule } from "markdown-it/lib/renderer.mjs";
import * as Sanitizer from "./sanitizer.js";

class MarkdownDirective extends Directive {
  #markdownIt = MarkdownIt({
    highlight: (str, lang) => {
      switch (lang) {
        case "html": {
          const iframe = document.createElement("iframe");
          iframe.classList.add("html-view");
          iframe.srcdoc = str;
          iframe.sandbox = "";
          return iframe.innerHTML;
        }

        default:
          return Sanitizer.escapeNodeText(str);
      }
    },
  });
  #lastValue: string | null = null;
  #lastTagClassMap: string | null = null;

  update(_part: Part, [value, tagClassMap]: DirectiveParameters<this>) {
    if (
      this.#lastValue === value &&
      JSON.stringify(tagClassMap) === this.#lastTagClassMap
    ) {
      return noChange;
    }

    this.#lastValue = value;
    this.#lastTagClassMap = JSON.stringify(tagClassMap);
    return this.render(value, tagClassMap);
  }

  #originalClassMap = new Map<string, RenderRule | undefined>();
  #applyTagClassMap(tagClassMap: Record<string, string[]>) {
    Object.entries(tagClassMap).forEach(([tag, classes]) => {
      let tokenName;
      switch (tag) {
        case "p":
          tokenName = "paragraph";
          break;
        case "h1":
        case "h2":
        case "h3":
        case "h4":
        case "h5":
        case "h6":
          tokenName = "heading";
          break;
        case "ul":
          tokenName = "bullet_list";
          break;
        case "ol":
          tokenName = "ordered_list";
          break;
        case "li":
          tokenName = "list_item";
          break;
        case "a":
          tokenName = "link";
          break;
        case "strong":
          tokenName = "strong";
          break;
        case "em":
          tokenName = "em";
          break;
      }

      if (!tokenName) {
        return;
      }

      const key = `${tokenName}_open`;
      const original: RenderRule | undefined =
        this.#markdownIt.renderer.rules[key];
      this.#originalClassMap.set(key, original);

      this.#markdownIt.renderer.rules[key] = (
        tokens,
        idx,
        options,
        env,
        self
      ) => {
        const token = tokens[idx];
        for (const clazz of classes) {
          token.attrJoin("class", clazz);
        }

        if (original) {
          return original.call(this, tokens, idx, options, env, self);
        } else {
          return self.renderToken(tokens, idx, options);
        }
      };
    });
  }

  #unapplyTagClassMap() {
    for (const [key, original] of this.#originalClassMap) {
      this.#markdownIt.renderer.rules[key] = original;
    }

    this.#originalClassMap.clear();
  }

  /**
   * Renders the markdown string to HTML using MarkdownIt.
   *
   * Note: MarkdownIt doesn't enable HTML in its output, so we render the
   * value directly without further sanitization.
   * @see https://github.com/markdown-it/markdown-it/blob/master/docs/security.md
   */
  render(value: string, tagClassMap?: Record<string, string[]>) {
    if (tagClassMap) {
      this.#applyTagClassMap(tagClassMap);
    }
    const htmlString = this.#markdownIt.render(value);
    this.#unapplyTagClassMap();

    return unsafeHTML(htmlString);
  }
}

export const markdown = directive(MarkdownDirective);

const markdownItStandalone = MarkdownIt();
export function renderMarkdownToHtmlString(value: string): string {
  return markdownItStandalone.render(value);
}
