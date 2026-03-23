/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Component, input, computed, ChangeDetectionStrategy, signal } from '@angular/core';
import { ComponentHostComponent } from '../../core/component-host.component';
import { BoundProperty } from '../../core/types';

/**
 * Angular implementation of the A2UI Tabs component (v0.9).
 *
 * Renders a set of tabs where each tab has a label and associated content.
 * Manages the active tab state internally.
 */
@Component({
  selector: 'a2ui-v09-tabs',
  standalone: true,
  imports: [ComponentHostComponent],
  template: `
    <div class="a2ui-tabs">
      <div class="a2ui-tab-bar">
        @for (tab of tabs(); track tab; let i = $index) {
          <button
            class="a2ui-tab-button"
            [class.active]="activeTabIndex() === i"
            (click)="setActiveTab(i)"
          >
            {{ tab.label }}
          </button>
        }
      </div>
      @if (activeTab()) {
        <div class="a2ui-tab-content">
          <a2ui-v09-component-host
            [componentId]="activeTab()?.content"
            [surfaceId]="surfaceId()"
            [dataContextPath]="dataContextPath()"
          >
          </a2ui-v09-component-host>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .a2ui-tabs {
        display: flex;
        flex-direction: column;
        width: 100%;
      }
      .a2ui-tab-bar {
        display: flex;
        border-bottom: 2px solid #eee;
        gap: 16px;
      }
      .a2ui-tab-button {
        padding: 8px 16px;
        border: none;
        background: none;
        cursor: pointer;
        font-weight: 500;
        color: #666;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
      }
      .a2ui-tab-button.active {
        color: #007bff;
        border-bottom: 2px solid #007bff;
      }
      .a2ui-tab-content {
        padding: 16px 0;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsComponent {
  /**
   * Reactive properties resolved from the A2UI {@link ComponentModel}.
   *
   * Expected properties:
   * - `tabs`: A list of tab objects, each containing a `label` and `content` ID.
   */
  props = input<Record<string, BoundProperty>>({});
  surfaceId = input.required<string>();
  componentId = input<string>();
  dataContextPath = input<string>('/');

  activeTabIndex = signal(0);

  tabs = computed(() => this.props()['tabs']?.value() || []);
  activeTab = computed(() => this.tabs()[this.activeTabIndex()]);

  setActiveTab(index: number) {
    this.activeTabIndex.set(index);
  }
}
