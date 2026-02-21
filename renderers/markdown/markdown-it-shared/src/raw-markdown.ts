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

import markdownit from 'markdown-it';
import { sanitizer } from './sanitizer.js';
import * as Types from '@a2ui/web_core';

/**
 * A pre-configured instance of markdown-it to render markdown in A2UI web.
 *
 * This renderer does not perform any sanitization of the outgoing HTML.
 */
export class MarkdownItRenderer {
  private markdownIt = markdownit({
    highlight: (str, lang) => {
      switch (lang) {
        case 'html': {
          const iframe = document.createElement('iframe');
          iframe.classList.add('html-view');
          iframe.srcdoc = str;
          iframe.sandbox.add('');
          return iframe.innerHTML;
        }

        default:
          return sanitizer.sanitize(str);
      }
    },
  });

  constructor() {
    this.registerTagClassMapRules();
  }

  /**
   * Registers rules to apply tag class maps from the environment.
   */
  private registerTagClassMapRules() {
    const rulesToProxy = [
      'paragraph_open',
      'heading_open',
      'bullet_list_open',
      'ordered_list_open',
      'list_item_open',
      'link_open',
      'strong_open',
      'em_open',
    ];

    for (const ruleName of rulesToProxy) {
      this.markdownIt.renderer.rules[ruleName] = (tokens, idx, options, env, self) => {
        const token = tokens[idx];
        const tagClassMap = env?.tagClassMap as Types.MarkdownRendererTagClassMap | undefined;

        if (tagClassMap) {
          const tokenClasses = tagClassMap[token.tag] ?? [];
          for (const clazz of tokenClasses) {
            token.attrJoin('class', clazz);
          }
        }

        return self.renderToken(tokens, idx, options);
      };
    }
  }

  /**
   * Renders the markdown string to HTML using the internal MarkdownIt instance.
   *
   * @param tagClassMap A map of tag names to classes to apply when rendering a tag.
   *
   * This method does not perform any sanitization of the outgoing HTML.
   */
  render(value: string, tagClassMap?: Types.MarkdownRendererTagClassMap) {
    return this.markdownIt.render(value, { tagClassMap });
  }
}

/**
 * A pre-configured instance of markdown-it to render markdown in A2UI web.
 *
 * This renderer does not perform any sanitization of the outgoing HTML.
 */
export const rawMarkdownRenderer = new MarkdownItRenderer();
