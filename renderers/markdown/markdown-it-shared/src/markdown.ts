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

import { rawMarkdownRenderer, TagClassMap } from "./raw-markdown.js";
import { sanitizer } from "./sanitizer.js";

// TODO: Do we need to export the TagClassMap type?

/**
 * A Markdown renderer using markdown-it and dompurify.
 */
export const markdownRenderer = {
  /**
   * Renders markdown to HTML.
   * @param value The markdown code to render.
   * @param tagClassMap A map of tag names to classes.
   * @returns The rendered HTML as a string.
   */
  render: (value: string, tagClassMap?: TagClassMap) => {
    const htmlString = rawMarkdownRenderer.render(value, tagClassMap);
    return sanitizer.sanitize(htmlString);
  },

  // TODO: Do we need an unsanitized renderer?
};
