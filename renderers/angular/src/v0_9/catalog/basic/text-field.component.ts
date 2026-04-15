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
import { BasicCatalogComponent } from './basic-catalog-component';

/**
 * Angular implementation of the A2UI TextField component (v0.9).
 *
 * Renders a text input field with an optional label and placeholder.
 * Updates the bound data model property on every input change.
 *
 * Supported CSS variables:
 * - `--a2ui-color-input`: Controls the background color of the input.
 * - `--a2ui-color-on-input`: Controls the text color of the input.
 * - `--a2ui-textfield-border`: Controls the border of the input.
 * - `--a2ui-textfield-border-radius`: Controls the border radius of the input.
 * - `--a2ui-textfield-padding`: Controls the padding of the input.
 * - `--a2ui-textfield-color-border-focus`: Controls the border color on focus.
 * - `--a2ui-textfield-color-error`: Controls the border and text color for error states.
 * - `--a2ui-textfield-label-font-size`: Controls the font size of the label.
 * - `--a2ui-textfield-label-font-weight`: Controls the font weight of the label.
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
        [class.invalid]="props()['isValid']?.value() === false"
      />
      @for (message of props()['validationErrors']?.value(); track message) {
        <div class="a2ui-error-message">{{ message }}</div>
      }
    </div>
  `,
  styles: [
    `
      .a2ui-text-field-container {
        display: flex;
        flex-direction: column;
        gap: var(--a2ui-spacing-xs, 4px);
        margin: var(--a2ui-spacing-xs, 4px);
      }
      label {
        font-size: var(--a2ui-textfield-label-font-size, var(--a2ui-label-font-size, var(--a2ui-font-size-s, 14px)));
        font-weight: var(--a2ui-textfield-label-font-weight, bold);
        color: var(--a2ui-text-color-text, var(--a2ui-color-on-background, #333));
      }
      input {
        padding: var(--a2ui-textfield-padding, 8px);
        border: var(--a2ui-textfield-border, 1px solid var(--a2ui-color-border, #ccc));
        border-radius: var(--a2ui-textfield-border-radius, 4px);
        background-color: var(--a2ui-color-input, #fff);
        color: var(--a2ui-color-on-input, #333);
      }
      input:focus {
        border-color: var(--a2ui-textfield-color-border-focus, var(--a2ui-color-primary, #17e));
        outline: none;
      }
      input.invalid {
        border-color: var(--a2ui-textfield-color-error, var(--a2ui-color-error, red));
      }
      .a2ui-error-message {
        color: var(--a2ui-textfield-color-error, var(--a2ui-color-error, red));
        font-size: var(--a2ui-font-size-xs, 12px);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextFieldComponent extends BasicCatalogComponent {
  /**
   * Reactive properties resolved from the A2UI {@link ComponentModel}.
   *
   * Expected properties:
   * - `value`: The current string value of the input.
   * - `label`: Optional label text to display above the input.
   * - `placeholder`: Hint text shown when the input is empty.
   * - `variant`: Input type variant ('default', 'obscured' (password), 'number').
   * - `checks`: Optional validation rules.
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
