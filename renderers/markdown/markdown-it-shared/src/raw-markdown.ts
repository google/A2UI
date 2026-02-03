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

import MarkdownIt from "markdown-it/index.js";
import { sanitizer } from "./sanitizer";

/**
 * A map of tag names to classes to apply when rendering a tag.
 *
 * For example, the following TagClassMap would apply the `a2ui-paragraph` class
 * to all `<p>` tags:
 *
 * `{ "p": ["a2ui-paragraph"] }`
 */
export type TagClassMap = Record<string, string[]>;

/**
 * A pre-configured instance of markdown-it to render markdown in A2UI web.
 *
 * This renderer does not perform any sanitization of the outgoing HTML.
 */
class MarkdownItCore {
  private markdownIt = MarkdownIt({
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
          return sanitizer.sanitize(str);
      }
    },
  });

  /**
   * Applies a tag class map to the markdown-it renderer.
   *
   * @param tagClassMap The tag class map to apply.
   */
  private applyTagClassMap(tagClassMap: TagClassMap) {
    Object.entries(tagClassMap).forEach(([tag]) => {
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
      this.markdownIt.renderer.rules[key] = (
        tokens,
        idx,
        options,
        _env,
        self
      ) => {
        const token = tokens[idx];
        const tokenClasses = tagClassMap[token.tag] ?? [];
        for (const clazz of tokenClasses) {
          token.attrJoin("class", clazz);
        }

        return self.renderToken(tokens, idx, options);
      };
    });
  }

  /**
   * Renders the markdown string to HTML using the internal MarkdownIt instance.
   *
   * @param tagClassMap A map of tag names to classes to apply when rendering a tag.
   *
   * This method does not perform any sanitization of the outgoing HTML.
   */
  render(value: string, tagClassMap?: TagClassMap) {
    if (tagClassMap) {
      this.applyTagClassMap(tagClassMap);
    }
    const htmlString = this.markdownIt.render(value);
    return htmlString;
  }
}

/**
 * A pre-configured instance of markdown-it to render markdown in A2UI web.
 *
 * This renderer does not perform any sanitization of the outgoing HTML.
 */
export const rawMarkdownRenderer = new MarkdownItCore();
