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
 * Angular implementation of the A2UI TextField component (v0.9).
 *
 * Renders a text input field with an optional label and placeholder.
 * Updates the bound data model property on every input change.
 */
@Component({
  selector: 'a2ui-v09-text-field',
  standalone: true,
  imports: [],
  template: `
    <div class="a2ui-text-field-container">
      @if (label()) {
        <label>{{ label() }}</label>
      }
      <input
        [type]="inputType()"
        [value]="value()"
        (input)="handleInput($event)"
        [placeholder]="placeholder()"
      />
      <!-- Validation errors would go here in a more advanced version -->
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        flex: 1;
        width: 100%;
      }
      .a2ui-text-field-container {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin: 4px;
      }
      input {
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextFieldComponent {
  /**
   * Reactive properties resolved from the A2UI {@link ComponentModel}.
   *
   * Expected properties:
   * - `value`: The current string value of the input.
   * - `label`: Optional label text to display above the input.
   * - `placeholder`: Hint text shown when the input is empty.
   * - `variant`: Input type variant ('default', 'obscured' (password), 'number').
   */
  props = input<Record<string, BoundProperty>>({});
  surfaceId = input.required<string>();
  componentId = input<string>();
  dataContextPath = input<string>('/');


  label = computed(() => this.props()['label']?.value());
  value = computed(() => this.props()['value']?.value() || '');
  placeholder = computed(() => this.props()['placeholder']?.value() || '');
  variant = computed(() => this.props()['variant']?.value());

  inputType = computed(() => {
    switch (this.variant()) {
      case 'obscured':
        return 'password';
      case 'number':
        return 'number';
      default:
        return 'text';
    }
  });

  handleInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    // Update the data path.  If anything is listening to this path, it will be
    // notified.
    this.props()['value']?.onUpdate(value);
  }
}
