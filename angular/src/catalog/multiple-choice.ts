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
import { DynamicComponent } from './rendering/dynamic-component';
import { v0_8 } from '@a2ui/web-lib';

@Component({
  selector: 'a2ui-multiple-choice',
  template: `
    <section>
      <select (change)="handleChange($event)" [value]="selectValue()">
        @for (option of options(); track option.value) {
          <option [value]="option.value">{{ resolvePrimitive(option.label) }}</option>
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
  `
})
export class MultipleChoice extends DynamicComponent {
  readonly options = input.required<{ label: v0_8.Primitives.StringValue; value: string }[]>();
  readonly value = input.required<v0_8.Primitives.StringValue | null>();
  protected selectValue = computed(() => super.resolvePrimitive(this.value()));

  protected handleChange(event: Event) {
    const path = this.value()?.path;

    if (!(event.target instanceof HTMLSelectElement) || !event.target.value || !path) {
      return;
    }

    this.processor.setData(
      this.component(),
      this.processor.resolvePath(path, this.component().dataContextPath),
      event.target.value
    );
  }
}
