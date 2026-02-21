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

import { rawMarkdownRenderer } from './raw-markdown.js';
import { sanitizer } from './sanitizer.js';
import * as Types from '@a2ui/web_core';

// Export the class and type for consumers
export { MarkdownItRenderer } from './raw-markdown.js';

/**
 * A Markdown to HTML renderer using markdown-it and dompurify.
 * @param value The markdown code to render.
 * @param options Options for the markdown renderer.
 * @returns The rendered HTML as a string.
 */
export function renderMarkdown(value: string, options?: Types.MarkdownRendererOptions): string {
  const htmlString = rawMarkdownRenderer.render(value, options?.tagClassMap);
  return sanitizer.sanitize(htmlString);
}
