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

import { Component, input, signal } from '@angular/core';
import { DynamicComponent } from './rendering/dynamic-component';
import { v0_8 } from '@a2ui/web-lib';
import { Renderer } from './rendering/renderer';

@Component({
  selector: 'a2ui-tabs',
  imports: [Renderer],
  template: `
    @let tabs = this.tabs();

    <section>
      @for (tab of tabs; track tab) {
        <button
          (click)="selectedIndex.set($index)"
          [disabled]="selectedIndex() === $index">{{resolvePrimitive(tab.title)}}</button>
      }

      <ng-container
        a2ui-renderer
        [surfaceId]="surfaceId()!"
        [component]="tabs[selectedIndex()].child"/>
    </section>
  `,
  styles: `
    :host {
      display: block;
      flex: var(--weight);
    }
  `
})
export class Tabs extends DynamicComponent {
  protected selectedIndex = signal(0);
  readonly tabs = input.required<v0_8.Types.ResolvedTabItem[]>();
}
