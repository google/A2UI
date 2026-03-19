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

import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { BoundProperty } from '../../core/types';


/**
 * An interactive text input component that supports labels, placeholders, and variants.
 *
 * It maps its value to a bound data path and supports 'obscured' (password) and
 * 'number' variants.
 */
@Component({
  selector: 'a2ui-v09-text-field',
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
   * Bound properties.
   */
  props = input<Record<string, BoundProperty>>({});
  surfaceId = input<string>();
  componentId = input<string>();
  dataContextPath = input<string>();



  variant = computed(() => this.props()['variant']?.value());
  label = computed(() => this.props()['label']?.value());
  value = computed(() => this.props()['value']?.value() ?? '');
  placeholder = computed(() => this.props()['placeholder']?.value() ?? '');

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
