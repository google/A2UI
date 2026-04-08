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
 * Angular implementation of the A2UI Slider component (v0.9).
 *
 * Renders a range input slider with a label and its current value.
 */
@Component({
  selector: 'a2ui-v09-slider',
  standalone: true,
  imports: [],
  template: `
    <div class="a2ui-slider-container">
      <div class="a2ui-slider-header">
        <span class="a2ui-slider-label">{{ label() }}</span>
        <span class="a2ui-slider-value">{{ value() }}</span>
      </div>
      <input
        type="range"
        [min]="min()"
        [max]="max()"
        [step]="step()"
        [value]="value() ?? min()"
        (input)="handleInput($event)"
        class="a2ui-slider"
      />
    </div>
  `,
  styles: [
    `
      .a2ui-slider-container {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .a2ui-slider-header {
        display: flex;
        justify-content: space-between;
        font-size: 14px;
      }
      .a2ui-slider {
        width: 100%;
        cursor: pointer;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SliderComponent {
  /**
   * Reactive properties resolved from the A2UI {@link ComponentModel}.
   *
   * Expected properties:
   * - `value`: The current numeric value.
   * - `label`: Label text to display.
   * - `min`: Minimum value (default: 0).
   * - `max`: Maximum value (default: 100).
   * - `step`: Increment step (default: 1).
   */
  props = input<Record<string, BoundProperty>>({});
  surfaceId = input.required<string>();
  componentId = input<string>();
  dataContextPath = input<string>('/');


  label = computed(() => this.props()['label']?.value());
  value = computed(() => this.props()['value']?.value());
  min = computed(() => this.props()['min']?.value() ?? 0);
  max = computed(() => this.props()['max']?.value() ?? 100);
  step = computed(() => this.props()['step']?.value() ?? 1);

  handleInput(event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    this.props()['value']?.onUpdate(val);
  }
}
