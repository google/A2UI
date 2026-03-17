/*
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DynamicComponent } from '../rendering/dynamic-component';
import { Types } from '../types';

@Component({
  selector: 'a2ui-multiple-choice',
  template: `
    <div [class]="theme.components.MultipleChoice.container" [style]="theme.additionalStyles?.MultipleChoice">
      <label [class]="theme.components.MultipleChoice.label" [for]="selectId">
        {{ label() }}
      </label>
      <select
        [class]="theme.components.MultipleChoice.element"
        [id]="selectId"
        [value]="value() ?? ''"
        (change)="onChange($event)"
      >
        @for (option of options(); track option.value) {
          <option [value]="option.value">{{ option.label }}</option>
        }
      </select>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultipleChoice extends DynamicComponent<Types.MultipleChoiceNode> {
  readonly label = input.required<Types.StringValue | null>();
  readonly options = input.required<{ label: Types.StringValue; value: string }[]>();
  readonly value = input.required<Types.StringValue | null>();

  protected readonly selectId = super.getUniqueId('a2ui-multiple-choice');

  onChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.handleAction('change', { value });
  }

  private handleAction(name: string, context: Record<string, unknown>) {
    super.sendAction({
      name,
      context: Object.entries(context).map(([key, val]) => ({
        key,
        value: typeof val === 'number' ? { literalNumber: val } : { literalString: String(val) }
      }))
    });
  }
}
