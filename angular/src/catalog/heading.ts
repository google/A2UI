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
import { v0_8 } from '@a2ui/web-lib';
import { DynamicComponent } from './rendering/dynamic-component';

@Component({
  selector: 'a2ui-heading',
  template: `<h1>{{ resolvedText() }}</h1>`,
  host: {
    '[attr.level]': 'level()',
  },
  styles: `
    :host {
      display: block;
      flex-grow: 0;
      flex-shrink: 0;
      flex-basis: auto;
      min-height: 0;
      overflow: auto;

      & h1 {
        line-height: 1.2;
      }
    }

    :host([level="1"]) h1 {
      font-size: 24px;
      margin: 0;
      padding: 0;
    }

    :host([level="2"]) h1 {
      font-size: 20px;
      margin: 0;
      padding: 0;
    }

    :host([level="3"]) h1 {
      font-size: 18px;
      margin: 0;
      padding: 0;
    }

    :host([level="4"]) h1 {
      font-size: 16px;
      margin: 0;
      padding: 0;
    }

    :host([level="5"]) h1 {
      font-size: 14px;
      margin: 0;
      padding: 0;
    }
  `,
})
export class Heading extends DynamicComponent {
  readonly text = input.required<v0_8.Primitives.StringValue | null>();
  readonly level = input.required<string | undefined>();
  protected resolvedText = computed(() => super.resolvePrimitive(this.text()) ?? '');
}
