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
} from "lit/directive.js";

/**
 * "Handles" Markdown rendering by doing nothing.
 *
 * Configure @a2ui/lit-markdown, or your custom Markdown renderer
 * to actually parse and render Markdown in your app.
 */
class NoopMarkdownRendererDirective extends Directive {
  render(markdown: string, _tagClassMap?: Record<string, string[]>) : TemplateResult {
    return html`<pre>${markdown}</pre>`;
  }
}

export const noopMarkdown = directive(NoopMarkdownRendererDirective);
