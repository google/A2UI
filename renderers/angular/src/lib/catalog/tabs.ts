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

import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { DynamicComponent } from '../rendering/dynamic-component';
import { Renderer } from '../rendering/renderer';
import * as Types from '@a2ui/web_core/types/types';

@Component({
  selector: 'a2ui-tabs',
  imports: [Renderer],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @let tabs = this.tabs();
    @let selectedIndex = this.selectedIndex();

    <section [class]="theme.components.Tabs.container" [style]="theme.additionalStyles?.Tabs">
      <div class="a2ui-tabs-container" [class]="theme.components.Tabs.element">
        @for (tab of tabs; track tab) {
          <button
            class="a2ui-tab-button"
            (click)="this.selectedIndex.set($index)"
            [disabled]="selectedIndex === $index"
            [class]="theme.components.Tabs.controls.all"
            [class.selected]="selectedIndex === $index"
          >
            {{ resolvePrimitive(tab.title) }}
          </button>
        }
      </div>

      <ng-container
        a2ui-renderer
        [surfaceId]="surfaceId()!"
        [component]="tabs[selectedIndex].child"
      />
    </section>
  `,
  styles: `
    :host {
      display: block;
      flex: var(--weight);
      width: 100%;
    }

    .a2ui-tabs-container {
      display: flex;
      flex-direction: row;
      width: 100%;
      overflow-x: auto;
    }

    .a2ui-tab-button {
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
    }
  `,
})
export class Tabs extends DynamicComponent {
  protected selectedIndex = signal(0);
  readonly tabs = input.required<Types.ResolvedTabItem[]>();
}
