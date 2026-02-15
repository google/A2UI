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

import MarkdownIt from 'markdown-it';

/**
 * MarkdownRenderer handles rendering markdown text with customizable
 * tag class mappings for consistent styling.
 *
 * Features:
 * - Standard markdown rendering via markdown-it
 * - Custom class injection for HTML elements
 * - HTML code block rendering in sandboxed iframes
 * - Basic sanitization for security
 */
export class MarkdownRenderer {
  private originalClassMap = new Map<string, any>();
  private markdownIt: MarkdownIt;

  constructor() {
    this.markdownIt = new MarkdownIt({
      html: false,
      linkify: true,
      typographer: true,
      highlight: (str: string, lang: string) => {
        if (lang === 'html') {
          // Render HTML in a sandboxed iframe for safety
          return `<iframe class="html-view" srcdoc="${this.escapeHtml(str)}" sandbox=""></iframe>`;
        }
        return `<pre><code class="language-${lang}">${this.escapeHtml(str)}</code></pre>`;
      },
    });
  }

  /**
   * Renders markdown to HTML with optional tag class mapping.
   *
   * @param value - The markdown string to render
   * @param tagClassMap - Optional mapping of HTML tags to CSS classes
   * @returns Sanitized HTML string
   */
  render(value: string, tagClassMap?: Record<string, string[]>): string {
    if (tagClassMap) {
      this.applyTagClassMap(tagClassMap);
    }
    const htmlString = this.markdownIt.render(value);
    this.unapplyTagClassMap();
    return this.sanitize(htmlString);
  }

  /**
   * Escapes HTML special characters.
   */
  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Basic HTML sanitization.
   * Removes script tags and event handlers.
   */
  private sanitize(html: string): string {
    if (typeof document === 'undefined') {
      // Server-side: basic regex-based sanitization
      return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    }

    // Client-side: use DOM for safer sanitization
    const div = document.createElement('div');
    div.innerHTML = html;

    // Remove script tags
    const scripts = div.querySelectorAll('script');
    scripts.forEach((s) => s.remove());

    // Remove event handlers
    div.querySelectorAll('*').forEach((el) => {
      const attrs = Array.from(el.attributes);
      attrs.forEach((attr) => {
        if (attr.name.startsWith('on')) {
          el.removeAttribute(attr.name);
        }
      });
    });

    return div.innerHTML;
  }

  /**
   * Applies custom CSS classes to rendered HTML elements.
   */
  private applyTagClassMap(tagClassMap: Record<string, string[]>): void {
    Object.entries(tagClassMap).forEach(([tag, classes]) => {
      let tokenName: string | undefined;
      switch (tag) {
        case 'p':
          tokenName = 'paragraph';
          break;
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          tokenName = 'heading';
          break;
        case 'ul':
          tokenName = 'bullet_list';
          break;
        case 'ol':
          tokenName = 'ordered_list';
          break;
        case 'li':
          tokenName = 'list_item';
          break;
        case 'a':
          tokenName = 'link';
          break;
        case 'strong':
          tokenName = 'strong';
          break;
        case 'em':
          tokenName = 'em';
          break;
      }

      if (!tokenName) return;

      const key = `${tokenName}_open`;
      const original = this.markdownIt.renderer.rules[key];
      this.originalClassMap.set(key, original);

      this.markdownIt.renderer.rules[key] = (tokens, idx, options, env, self) => {
        const token = tokens[idx];
        for (const clazz of classes) {
          token.attrJoin('class', clazz);
        }
        return original
          ? original.call(this, tokens, idx, options, env, self)
          : self.renderToken(tokens, idx, options);
      };
    });
  }

  /**
   * Restores original markdown-it rendering rules.
   */
  private unapplyTagClassMap(): void {
    for (const [key, original] of this.originalClassMap) {
      this.markdownIt.renderer.rules[key] = original;
    }
    this.originalClassMap.clear();
  }
}

/**
 * Singleton markdown renderer instance.
 * Use this for consistent rendering across the application.
 */
export const markdownRenderer = new MarkdownRenderer();
