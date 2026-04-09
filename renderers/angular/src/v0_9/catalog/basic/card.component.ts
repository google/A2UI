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
import { ComponentHostComponent } from '../../core/component-host.component';
import { BoundProperty } from '../../core/types';

/**
 * Angular implementation of the A2UI Card component (v0.9).
 *
 * Renders a container with a shadow and rounded corners for grouping related content.
 */
@Component({
  selector: 'a2ui-v09-card',
  standalone: true,
  imports: [ComponentHostComponent],
  template: `
    <div class="a2ui-card">
      @if (child()) {
        <a2ui-v09-component-host
          [componentKey]="child()!"
          [surfaceId]="surfaceId()"
        >
        </a2ui-v09-component-host>
      }
    </div>
  `,
  styles: [
    `
      .a2ui-card {
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        background-color: white;
        border: 1px solid #eee;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  /**
   * Reactive properties resolved from the A2UI {@link ComponentModel}.
   *
   * Expected properties:
   * - `child`: The component ID to render inside the card.
   */
  props = input<Record<string, BoundProperty>>({});
  surfaceId = input.required<string>();
  componentId = input<string>();
  dataContextPath = input<string>('/');

  child = computed(() => this.props()['child']?.value());


}
