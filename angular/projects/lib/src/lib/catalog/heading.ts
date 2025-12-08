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
import * as v0_8 from '@a2ui/web-lib/0.8';
import { DynamicComponent } from '../rendering/dynamic-component';

@Component({
  selector: 'a2ui-heading',
  template: `
    <h1 [class]="classes()" [style]="theme.additionalStyles?.Heading">
      {{ resolvedText() }}
    </h1>
  `,
  host: {
    '[attr.level]': 'level()',
  },
  styles: `
    :host {
      display: flex;
      flex: var(--weight) 0 auto;
      min-height: 0;
      overflow: auto;
    }
  `,
})
export class Heading extends DynamicComponent {
  readonly text = input.required<v0_8.Primitives.StringValue | null>();
  // TODO: Render a different heading level based on this input.
  readonly level = input.required<string | undefined>();
  protected resolvedText = computed(() => super.resolvePrimitive(this.text()) ?? '');

  protected readonly classes = computed(() => {
    return v0_8.Styles.merge(
      this.theme.components.Text.all,
      // TODO: Render a different heading level based on input.
      // this.theme.components.Text[classKey]
    );
  });
}
