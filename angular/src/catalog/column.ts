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

import { Component, input } from '@angular/core';
import { v0_8 } from '@a2ui/web-lib';
import { DynamicComponent } from './rendering/dynamic-component';

@Component({
  selector: 'a2ui-column',
  styles: `
    :host {
      display: block;
      outline: solid 1px red;
      padding: 20px;
    }
  `,
  template: `
    <!-- TODO: implement theme -->
    <ng-content></ng-content>
  `,
})
export class Column extends DynamicComponent {
  readonly alignment = input<v0_8.Types.ResolvedColumn['alignment']>('stretch');
  readonly distribution = input<v0_8.Types.ResolvedColumn['distribution']>('start');

  // TODO: theme?
}
