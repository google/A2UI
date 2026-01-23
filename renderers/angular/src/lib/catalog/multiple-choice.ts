/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import { Component, computed, input } from '@angular/core';
import { DynamicComponent } from '../rendering/dynamic-component';
import { Primitives, Types } from '@a2ui/lit/0.8';

@Component({
  selector: 'a2ui-multiple-choice',
  template: `
    <section [class]="theme.components.MultipleChoice.container">
      <label [class]="theme.components.MultipleChoice.label" [for]="selectId">{{
        description()
      }}</label>

      <select
        (change)="handleChange($event)"
        [id]="selectId"
        [multiple]="isMultiple()"
        [class]="theme.components.MultipleChoice.element"
        [style]="theme.additionalStyles?.MultipleChoice"
      >
        @for (option of options(); track option.value) {
          <option
            [value]="option.value"
            [selected]="selectedValues().includes(option.value)"
          >
            {{ resolvePrimitive(option.label) }}
          </option>
        }
      </select>
    </section>
  `,
  styles: `
    :host {
      display: block;
      flex: var(--weight);
      min-height: 0;
      overflow: auto;
    }

    select {
      width: 100%;
      box-sizing: border-box;
    }
  `,
})
export class MultipleChoice extends DynamicComponent {
  readonly options = input.required<{ label: Primitives.StringValue; value: string }[]>();
  readonly selections =
    input.required<Types.ResolvedMultipleChoice['selections'] | Primitives.StringValue | null>();
  readonly maxAllowedSelections = input<number | null>(null);
  readonly description = input.required<string>();

  protected readonly selectId = super.getUniqueId('a2ui-multiple-choice');
  protected selectedValues = computed(() => this.resolveSelections());
  protected isMultiple = computed(() => {
    const maxSelections = this.maxAllowedSelections();
    const selections = this.selectedValues();
    return typeof maxSelections === 'number' ? maxSelections > 1 : selections.length > 1;
  });

  protected handleChange(event: Event) {
    const selections = this.selections();
    const path = selections?.path;

    if (!(event.target instanceof HTMLSelectElement) || !path) {
      return;
    }

    const isMultiple = this.isMultiple();
    const selectedValues = isMultiple
      ? Array.from(event.target.selectedOptions).map((option) => option.value)
      : [event.target.value];
    const maxSelections = this.maxAllowedSelections();
    const nextSelections =
      typeof maxSelections === 'number' && selectedValues.length > maxSelections
        ? selectedValues.slice(0, maxSelections)
        : selectedValues;

    if (isMultiple && nextSelections.length !== selectedValues.length) {
      const allowed = new Set(nextSelections);
      for (const option of Array.from(event.target.options)) {
        option.selected = allowed.has(option.value);
      }
    }

    this.processor.setData(this.component(), path, nextSelections, this.surfaceId());
  }

  private resolveSelections() {
    const selections = this.selections();

    if (!selections || typeof selections !== 'object') {
      return [];
    }

    if ('literalArray' in selections) {
      return Array.isArray(selections.literalArray) ? selections.literalArray : [];
    }

    if ('literalString' in selections) {
      return selections.literalString ? [selections.literalString] : [];
    }

    if ('literal' in selections) {
      return selections.literal != null ? [selections.literal] : [];
    }

    if (selections.path) {
      const resolved = this.processor.getData(
        this.component(),
        selections.path,
        this.surfaceId() ?? undefined,
      );
      if (Array.isArray(resolved)) {
        return resolved.filter((value): value is string => typeof value === 'string');
      }
      return typeof resolved === 'string' ? [resolved] : [];
    }

    return [];
  }
}
