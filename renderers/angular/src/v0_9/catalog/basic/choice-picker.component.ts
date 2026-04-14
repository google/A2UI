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
 * Angular implementation of the A2UI ChoicePicker component (v0.9).
 *
 * Renders a set of options as either radio buttons/checkboxes or chips.
 * Supports both single and multiple selection.
 */
@Component({
  selector: 'a2ui-v09-choice-picker',
  standalone: true,
  imports: [],
  template: `
    <div class="a2ui-choice-picker">
      <!-- Chips Variant -->
      @if (displayStyle() === 'chips') {
        <div class="a2ui-chips-group">
          @for (choice of choices(); track choice.value) {
            <button
              class="a2ui-chip"
              [class.active]="isSelected(choice.value)"
              (click)="toggleActive(choice.value)"
            >
              {{ choice.label }}
            </button>
          }
        </div>
      } @else {
        <!-- Checkbox/Radio Variant -->
        <div class="a2ui-options-group">
          @for (choice of choices(); track choice.value) {
            <label class="a2ui-option-label">
              <input
                [type]="isMultiple() ? 'checkbox' : 'radio'"
                [name]="componentId()"
                [value]="choice.value"
                [checked]="isSelected(choice.value)"
                (change)="onCheckChange(choice.value, $event)"
                class="a2ui-option-input"
              />
              <span class="a2ui-option-text">{{ choice.label }}</span>
            </label>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .a2ui-choice-picker {
        width: 100%;
      }
      .a2ui-options-group {
        display: flex;
        flex-direction: column;
        gap: var(--a2ui-choicepicker-gap, var(--a2ui-spacing-xs, 0.25rem));
      }
      .a2ui-option-label {
        display: flex;
        align-items: center;
        gap: var(--a2ui-choicepicker-gap, var(--a2ui-spacing-xs, 0.25rem));
        cursor: pointer;
      }
      .a2ui-option-input {
        width: var(--a2ui-choicepicker-checkbox-size, 1rem);
        height: var(--a2ui-choicepicker-checkbox-size, 1rem);
      }
      .a2ui-chips-group {
        display: flex;
        flex-wrap: wrap;
        gap: var(--a2ui-choicepicker-gap, var(--a2ui-spacing-xs, 0.25rem));
      }
      .a2ui-chip {
        padding: var(--a2ui-choicepicker-chip-padding, var(--a2ui-spacing-s, 0.5rem) var(--a2ui-spacing-m, 1rem));
        border-radius: var(--a2ui-choicepicker-chip-border-radius, 100px);
        border: var(--a2ui-choicepicker-chip-border, 1px solid var(--a2ui-color-border, #ccc));
        background: var(--a2ui-choicepicker-chip-background, var(--a2ui-color-surface, #fff));
        cursor: pointer;
        transition: all 0.2s;
      }
      .a2ui-chip.active {
        background-color: var(--a2ui-choicepicker-chip-background-selected, var(--a2ui-color-primary, #17e));
        color: var(--a2ui-color-on-primary, #fff);
        border-color: var(--a2ui-choicepicker-chip-background-selected, var(--a2ui-color-primary, #17e));
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChoicePickerComponent extends BasicCatalogComponent {
  /**
   * Reactive properties resolved from the A2UI {@link ComponentModel}.
   *
   * Expected properties:
   * - `value`: The currently selected value(s).
   * - `choices` or `options`: List of choice objects (label and value).
   * - `displayStyle`: How to render the choices ('default' or 'chips').
   * - `variant`: Selection mode ('singleSelection' or 'multipleSelection').
   */
  props = input<Record<string, BoundProperty>>({});
  surfaceId = input.required<string>();
  componentId = input<string>();
  dataContextPath = input<string>('/');

  displayStyle = computed(() => this.props()['displayStyle']?.value());
  choices = computed(
    () => this.props()['choices']?.value() || this.props()['options']?.value() || [],
  );
  variant = computed(() => this.props()['variant']?.value());
  selectedValue = computed(() => this.props()['value']?.value());

  isMultiple(): boolean {
    return this.variant() === 'multipleSelection';
  }

  isSelected(value: string): boolean {
    const selected = this.selectedValue();
    if (Array.isArray(selected)) {
      return selected.includes(value);
    }
    return selected === value;
  }

  onCheckChange(value: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.updateValue(value, checked);
  }

  toggleActive(value: string) {
    const current = this.isSelected(value);
    this.updateValue(value, !current);
  }

  private updateValue(value: string, active: boolean) {
    const current = this.selectedValue();
    if (this.isMultiple()) {
      let next = Array.isArray(current) ? [...current] : [];
      if (active) {
        if (!next.includes(value)) next.push(value);
      } else {
        next = next.filter((v: any) => v !== value);
      }
      this.props()['value']?.onUpdate(next);
    } else {
      if (active) {
        this.props()['value']?.onUpdate(value);
      }
    }
  }
}
