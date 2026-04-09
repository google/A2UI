/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Component, input, computed, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { BoundProperty } from '../../core/types';
import { MarkdownRenderer } from '../../core/markdown';

/**
 * Angular implementation of the A2UI Text component (v0.9).
 *
 * Renders text with support for simple Markdown.
 */
@Component({
  selector: 'a2ui-v09-text',
  standalone: true,
  template: `
    <span [class]="'a2ui-text ' + variant()" [innerHTML]="resolvedText()">
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextComponent {
  /**
   * Reactive properties resolved from the A2UI {@link ComponentModel}.
   *
   * Expected properties:
   * - `text`: The string content to display.
   * - `variant`: A hint for the base text style ('h1', 'h2', 'h3', 'h4', 'h5', 'caption', 'body').
   */
  props = input<Record<string, BoundProperty>>({});
  surfaceId = input.required<string>();
  componentId = input<string>();
  dataContextPath = input<string>('/');

  private markdownRenderer = inject(MarkdownRenderer);

  variant = computed(() => this.props()['variant']?.value() || 'body');
  text = computed(() => this.props()['text']?.value() || '');

  resolvedText = signal<string>('');
  private renderRequestId = 0;

  constructor() {
    effect(() => {
      const text = this.text();
      const variant = this.variant();
      let value = text;

      switch (variant) {
        case 'h1': value = `# ${text}`; break;
        case 'h2': value = `## ${text}`; break;
        case 'h3': value = `### ${text}`; break;
        case 'h4': value = `#### ${text}`; break;
        case 'h5': value = `##### ${text}`; break;
        case 'caption': value = `*${text}*`; break;
      }

      const requestId = ++this.renderRequestId;
      this.markdownRenderer.render(value).then(rendered => {
        if (requestId === this.renderRequestId) {
          this.resolvedText.set(rendered);
        }
      });
    });
  }
}
