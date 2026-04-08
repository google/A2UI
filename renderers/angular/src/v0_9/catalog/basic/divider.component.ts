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
 * Angular implementation of the A2UI Divider component (v0.9).
 *
 * Renders a horizontal or vertical line to separate content.
 */
@Component({
  selector: 'a2ui-v09-divider',
  standalone: true,
  imports: [],
  template: `
    <hr
      class="a2ui-divider"
      [class.horizontal]="axis() === 'horizontal'"
      [class.vertical]="axis() === 'vertical'"
    />
  `,
  styles: [
    `
      .a2ui-divider {
        border: 0;
        border-top: 1px solid #eee;
        margin: 16px 0;
        width: 100%;
      }
      .a2ui-divider.vertical {
        width: 1px;
        height: 100%;
        margin: 0 16px;
        border-top: 0;
        border-left: 1px solid #eee;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DividerComponent {
  /**
   * Reactive properties resolved from the A2UI {@link ComponentModel}.
   *
   * Expected properties:
   * - `axis`: The orientation of the divider ('horizontal' (default) or 'vertical').
   */
  props = input<Record<string, BoundProperty>>({});
  surfaceId = input.required<string>();
  componentId = input<string>();
  dataContextPath = input<string>('/');

  axis = computed(() => this.props()['axis']?.value() ?? 'horizontal');
}
