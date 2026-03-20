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

import { Component, input, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { A2uiRendererService } from '../../core/a2ui-renderer.service';
import { BoundProperty } from '../../core/types';

/**
 * Angular implementation of the A2UI CheckBox component (v0.9).
 *
 * Renders a checkbox with a label. Updates the bound data model property
 * when the checked state changes.
 */
@Component({
  selector: 'a2ui-v09-check-box',
  standalone: true,
  imports: [],
  template: `
    <label class="a2ui-check-box-label">
      <input
        type="checkbox"
        [checked]="value()"
        (change)="handleChange($event)"
        class="a2ui-check-box-input"
      />
      <span class="a2ui-check-box-text">{{ label() }}</span>
    </label>
  `,
  styles: [
    `
      .a2ui-check-box-label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        padding: 4px 0;
      }
      .a2ui-check-box-input {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }
      .a2ui-check-box-text {
        font-size: 16px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckBoxComponent {
  /**
   * Reactive properties resolved from the A2UI {@link ComponentModel}.
   *
   * Expected properties:
   * - `label`: The text to display next to the checkbox.
   * - `value`: Boolean indicating whether the checkbox is checked.
   */
  props = input<Record<string, BoundProperty>>({});
  surfaceId = input.required<string>();
  componentId = input<string>();
  dataContextPath = input<string>('/');

  private rendererService = inject(A2uiRendererService);

  value = computed(() => this.props()['value']?.value() === true);
  label = computed(() => this.props()['label']?.value());

  handleChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.props()['value']?.onUpdate(checked);
  }
}
