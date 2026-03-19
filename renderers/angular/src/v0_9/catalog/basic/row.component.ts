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
import { getNormalizedPath } from '../../core/utils';

/**
 * Angular implementation of the A2UI Row component (v0.9).
 *
 * Arranges child components in a horizontal flex layout. Supports both static
 * lists of children and repeating templates bound to a data collection.
 */
@Component({
  selector: 'a2ui-v09-row',
  standalone: true,
  imports: [ComponentHostComponent],
  template: `
    <div
      class="a2ui-row"
      [style.justify-content]="justify()"
      [style.align-items]="align()"
      style="display: flex; flex-direction: row; width: 100%; gap: 4px;"
    >
      @if (!isRepeating()) {
        @for (childId of children(); track childId) {
          <a2ui-v09-component-host
            [componentId]="childId"
            [surfaceId]="surfaceId()"
            [dataContextPath]="dataContextPath()"
          >
          </a2ui-v09-component-host>
        }
      }

      @if (isRepeating()) {
        @for (item of children(); track item; let i = $index) {
          <a2ui-v09-component-host
            [componentId]="templateId()!"
            [surfaceId]="surfaceId()"
            [dataContextPath]="getNormalizedPath(i)"
          >
          </a2ui-v09-component-host>
        }
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RowComponent {
  /**
   * Reactive properties resolved from the A2UI {@link ComponentModel}.
   *
   * Expected properties:
   * - `children`: A list of component IDs OR a repeating collection definition.
   * - `justify`: Flexbox justify-content value (e.g., 'flex-start', 'center').
   * - `align`: Flexbox align-items value (e.g., 'flex-start', 'center').
   */
  props = input<Record<string, BoundProperty>>({});
  surfaceId = input.required<string>();
  dataContextPath = input<string>('/');

  protected justify = computed(() => this.props()['justify']?.value());
  protected align = computed(() => this.props()['align']?.value());

  protected children = computed(() => {
    const raw = this.props()['children']?.value() || [];
    return Array.isArray(raw) ? raw : [];
  });

  protected isRepeating = computed(() => {
    return !!this.props()['children']?.raw?.componentId;
  });

  protected templateId = computed(() => {
    return this.props()['children']?.raw?.componentId;
  });

  protected getNormalizedPath(index: number) {
    return getNormalizedPath(this.props()['children']?.raw?.path, this.dataContextPath(), index);
  }
}
