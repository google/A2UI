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

import { computed, Component, input } from '@angular/core';
import { DynamicComponent } from '../rendering/dynamic-component';
import { v0_8 } from '@a2ui/web-lib';

@Component({
  selector: 'input[a2ui-datetime-input]',
  template: '',
  host: {
    autocomplete: 'off',
    type: 'datetime-local',
    placeholder: 'Date & Time',
    '(input)': 'handleInput($event)',
    '[value]': 'inputValue()',
    '[class]': 'theme.components.DateTimeInput',
    '[style]': 'theme.additionalStyles?.DateTimeInput',
  },
  styles: `
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
    }
  `,
})
export class DatetimeInput extends DynamicComponent {
  readonly value = input.required<v0_8.Primitives.StringValue | null>();
  protected inputValue = computed(() => super.resolvePrimitive(this.value()) || '');

  protected handleInput(event: Event) {
    const path = this.value()?.path;

    if (!(event.target instanceof HTMLInputElement) || !path) {
      return;
    }

    this.processor.setData(this.component(), path, event.target.value, this.surfaceId());
  }
}
