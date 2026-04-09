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

import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { ComponentHostComponent } from '../../core/component-host.component';
import { BoundProperty } from '../../core/types';

/**
 * Angular implementation of the A2UI List component (v0.9).
 *
 * Renders a list of child components with support for ordered, unordered,
 * and unstyled layouts in both vertical and horizontal orientations.
 */
@Component({
  selector: 'a2ui-v09-list',
  standalone: true,
  imports: [ComponentHostComponent],
  template: `
    @switch (listTag()) {
      @case ('ol') {
        <ol [class]="'a2ui-list ' + orientation()" [style.list-style-type]="styleType()">
          @for (child of children(); track child.id) {
            <li>
              <a2ui-v09-component-host
                [componentKey]="child"
                [surfaceId]="surfaceId()"
              >
              </a2ui-v09-component-host>
            </li>
          }
        </ol>
      }
      @case ('ul') {
        <ul [class]="'a2ui-list ' + orientation()" [style.list-style-type]="styleType()">
          @for (child of children(); track child.id) {
            <li>
              <a2ui-v09-component-host
                [componentKey]="child"
                [surfaceId]="surfaceId()"
              >
              </a2ui-v09-component-host>
            </li>
          }
        </ul>
      }
      @default {
        <div [class]="'a2ui-list ' + orientation()" style="list-style-type: none;">
          @for (child of children(); track child.id) {
            <div class="a2ui-list-item-none">
              <a2ui-v09-component-host
                [componentKey]="child"
                [surfaceId]="surfaceId()"
              >
              </a2ui-v09-component-host>
            </div>
          }
        </div>
      }
    }
  `,
  styles: [
    `
      .a2ui-list {
        display: flex;
        padding-inline-start: 24px;
        margin: 0;
      }
      .a2ui-list.vertical {
        flex-direction: column;
        gap: 8px;
      }
      .a2ui-list.horizontal {
        flex-direction: row;
        gap: 16px;
        list-style-position: inside;
      }
      .a2ui-list-item-none {
        display: block;
      }
      .horizontal .a2ui-list-item-none {
        display: inline-block;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListComponent {
  /**
   * Reactive properties resolved from the A2UI {@link ComponentModel}.
   *
   * Expected properties:
   * - `children`: A list of component IDs to render as list items.
   * - `listStyle`: The type of list ('ordered', 'unordered', 'none').
   * - `orientation`: The layout direction ('vertical', 'horizontal').
   */
  props = input<Record<string, BoundProperty>>({});
  surfaceId = input.required<string>();
  componentId = input<string>();
  dataContextPath = input<string>('/');

  listStyle = computed(() => this.props()['listStyle']?.value());
  orientation = computed(() => this.props()['orientation']?.value() || 'vertical');
  children = computed(() => {
    const raw = this.props()['children']?.value();
    return Array.isArray(raw) ? raw : [];
  });



  listTag = computed(() => {
    const style = this.listStyle();
    if (style === 'ordered') return 'ol';
    if (style === 'unordered') return 'ul';
    return 'div';
  });

  styleType = computed(() => {
    const style = this.listStyle();
    if (style === 'none') return 'none';
    return '';
  });
}
