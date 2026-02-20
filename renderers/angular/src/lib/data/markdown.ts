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

import { inject, Injectable, InjectionToken, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import * as Types from '@a2ui/web_core/types/types';

// We need this because Types.MarkdownRenderer is a raw TS type, and can't be used as a token directly.
const MARKDOWN_RENDERER_TOKEN = new InjectionToken<Types.MarkdownRenderer>('MARKDOWN_RENDERER');

@Injectable({ providedIn: 'root' })
export class MarkdownRenderer {

  private markdownRenderer = inject(MARKDOWN_RENDERER_TOKEN, { optional: true });
  private sanitizer = inject(DomSanitizer);
  private static defaultMarkdownWarningLogged = false;

  render(value: string, markdownOptions?: Types.MarkdownRendererOptions) {
    if (this.markdownRenderer) {
      // The markdownRenderer should return a sanitized string.
      return this.markdownRenderer(value, markdownOptions);
    }

    if (!MarkdownRenderer.defaultMarkdownWarningLogged) {
      console.warn("[MarkdownRenderer]",
        "can't render markdown because no markdown renderer is configured.\n",
        "Use `@a2ui/markdown-it-shared`, or your own markdown renderer.");
      MarkdownRenderer.defaultMarkdownWarningLogged = true;
    }

    // Return a span with a sanitized version of the input `value`.
    const sanitizedValue = this.sanitizer.sanitize(SecurityContext.HTML, value);
    return `<span class="no-markdown-renderer">${sanitizedValue}</span>`;
  }
}

/**
 * Allows the user to provide a markdown renderer function.
 * @param {Types.MarkdownRenderer} markdownRenderer a markdown renderer function.
 * @returns an Angular provider for the markdown renderer.
 */
export function provideMarkdownRenderer(markdownRenderer: Types.MarkdownRenderer) {
  return {
    provide: MARKDOWN_RENDERER_TOKEN,
    useValue: markdownRenderer,
  };
}
