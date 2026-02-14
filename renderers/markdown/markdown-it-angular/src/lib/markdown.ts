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

import { Injectable } from '@angular/core';
import { markdownRenderer } from '@a2ui/markdown-it-shared';
import * as Types from '@a2ui/web_core/types/types';

/**
 * Wraps the `markdownRenderer` from `@a2ui/markdown-it-shared` to provide
 * Angular integration.
 */
@Injectable({ providedIn: 'root' })
export class MarkdownItMarkdownRenderer implements Types.MarkdownRenderer<string> {
  render(value: string, tagClassMap?: Types.MarkdownRendererTagClassMap) {
    return markdownRenderer.render(value, tagClassMap);
  }
}

// TODO: Import @a2ui/angular and provide a ready-made provider so users can
// override the default renderer more easily?
// export const markdownRendererProvider = {
//   provide: MarkdownRenderer,
//   useClass: MarkdownItMarkdownRenderer
// };
