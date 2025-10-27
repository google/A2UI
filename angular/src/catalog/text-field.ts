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
import { DynamicComponent } from './rendering/dynamic-component';
import { v0_8 } from '@a2ui/web-lib';

@Component({
  selector: 'input[a2ui-text-field]',
  template: '',
  host: {
    autocomplete: 'off',
    '(input)': 'handleInput($event)',
    '[value]': 'inputValue()',
    '[attr.placeholder]': 'placeholder()',
    '[type]': 'inputType() === "number" ? "number" : "text"',
  },
  styles: `
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
    }
  `
})
export class TextField extends DynamicComponent {
  readonly text = input.required<v0_8.Primitives.StringValue | null>();
  readonly label = input.required<v0_8.Primitives.StringValue | null>();
  readonly inputType = input.required<v0_8.Types.ResolvedTextField['type'] | null>();

  protected inputValue = computed(() => super.resolvePrimitive(this.text()) || '');
  protected placeholder = computed(() => super.resolvePrimitive(this.label()));

  protected handleInput(event: Event) {
    const path = this.text()?.path;

    if (!(event.target instanceof HTMLInputElement) || !path) {
      return;
    }

    this.processor.setData(this.component(), path, event.target.value, this.surfaceId());
  }
}
