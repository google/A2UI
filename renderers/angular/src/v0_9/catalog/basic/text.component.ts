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

import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { BoundProperty } from '../../core/types';

/**
 * Angular implementation of the A2UI Text component (v0.9).
 *
 * Renders a span of text with configurable font weight and style.
 */
@Component({
  selector: 'a2ui-v09-text',
  standalone: true,
  imports: [],
  template: `
    <span [style.font-weight]="weight()" [style.font-style]="style()">
      {{ text() }}
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
   * - `weight`: Font weight (e.g., 'bold', 'normal' or numeric string).
   * - `style`: Font style (e.g., 'italic', 'normal').
   */
  props = input<Record<string, BoundProperty>>({});
  surfaceId = input.required<string>();
  componentId = input<string>();
  dataContextPath = input<string>('/');

  weight = computed(() => this.props()['weight']?.value());
  style = computed(() => this.props()['style']?.value());
  text = computed(() => this.props()['text']?.value());
}
