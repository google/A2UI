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
 * Angular implementation of the A2UI DateTimeInput component (v0.9).
 *
 * Renders date and/or time input fields. Combines them into an ISO string
 * for the bound data model property.
 */
@Component({
  selector: 'a2ui-v09-date-time-input',
  standalone: true,
  imports: [],
  template: `
    <div class="a2ui-date-time-container">
      @if (label()) {
        <label class="a2ui-date-time-label">
          {{ label() }}
        </label>
      }
      <div class="a2ui-date-time-inputs">
        @if (enableDate()) {
          <input
            type="date"
            [value]="dateValue()"
            (change)="handleDateChange($event)"
            class="a2ui-date-time-input"
          />
        }
        @if (enableTime()) {
          <input
            type="time"
            [value]="timeValue()"
            (change)="handleTimeChange($event)"
            class="a2ui-date-time-input"
          />
        }
      </div>
    </div>
  `,
  styles: [
    `
      .a2ui-date-time-container {
        display: flex;
        flex-direction: column;
        gap: 4px;
        width: 100%;
      }
      .a2ui-date-time-label {
        font-size: 14px;
        color: #666;
      }
      .a2ui-date-time-inputs {
        display: flex;
        gap: 8px;
        width: 100%;
      }
      .a2ui-date-time-input {
        padding: 8px;
        border-radius: 4px;
        border: 1px solid #ccc;
        font-family: inherit;
        flex: 1;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateTimeInputComponent {
  /**
   * Reactive properties resolved from the A2UI {@link ComponentModel}.
   *
   * Expected properties:
   * - `value`: The current ISO date/time string.
   * - `label`: Optional label text.
   * - `enableDate`: Whether to show the date picker (default: true).
   * - `enableTime`: Whether to show the time picker (default: false).
   */
  props = input<Record<string, BoundProperty>>({});
  surfaceId = input.required<string>();
  componentId = input<string>();
  dataContextPath = input<string>('/');

  label = computed(() => this.props()['label']?.value());
  enableDate = computed(() => this.props()['enableDate']?.value() ?? true);
  enableTime = computed(() => this.props()['enableTime']?.value() ?? false);

  private rawValue = computed(() => this.props()['value']?.value() || '');

  dateValue = computed(() => {
    const val = this.rawValue();
    if (!val) return '';
    return val.includes('T') ? val.split('T')[0] : val;
  });

  timeValue = computed(() => {
    const val = this.rawValue();
    if (!val || !val.includes('T')) return '';
    return val.split('T')[1].substring(0, 5);
  });

  handleDateChange(event: Event) {
    const date = (event.target as HTMLInputElement).value;
    const current = this.rawValue();
    if (this.enableTime()) {
      const time = current.includes('T') ? current.split('T')[1] : '00:00:00';
      this.props()['value']?.onUpdate(`${date}T${time}`);
    } else {
      this.props()['value']?.onUpdate(date);
    }
  }

  handleTimeChange(event: Event) {
    const time = (event.target as HTMLInputElement).value;
    const current = this.rawValue();
    const date = current.includes('T')
      ? current.split('T')[0]
      : current || new Date().toISOString().split('T')[0];
    this.props()['value']?.onUpdate(`${date}T${time}:00`);
  }
}
