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
import { BoundProperty } from '../../core/types';

/**
 * Angular implementation of the A2UI Icon component (v0.9).
 *
 * Supports both Material Icons (by name) and custom SVG icons (by path).
 */
@Component({
  selector: 'a2ui-v09-icon',
  standalone: true,
  imports: [],
  template: `
    @if (isPath()) {
      <svg class="a2ui-icon svg" viewBox="0 0 24 24" [style.fill]="color() || 'currentColor'">
        <path [attr.d]="path()"></path>
      </svg>
    } @else {
      <i class="material-icons a2ui-icon" [style.color]="color()">
        {{ iconName() }}
      </i>
    }
  `,
  styles: [
    `
      .a2ui-icon {
        display: inline-block;
        width: 24px;
        height: 24px;
        font-size: 24px;
        font-family: 'Material Icons';
        line-height: 1;
        text-transform: none;
        letter-spacing: normal;
        word-wrap: normal;
        white-space: nowrap;
        direction: ltr;
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
        -moz-osx-font-smoothing: grayscale;
        font-feature-settings: 'liga';
        vertical-align: middle;
      }
      .a2ui-icon.svg {
        fill: currentColor;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  /**
   * Reactive properties resolved from the A2UI {@link ComponentModel}.
   *
   * Expected properties:
   * - `name`: The name of the icon (e.g., 'home', 'settings') OR an object
   *           with a `path` property for SVG icons.
   * - `color`: The CSS color to apply to the icon.
   */
  props = input<Record<string, BoundProperty>>({});
  surfaceId = input.required<string>();
  componentId = input<string>();
  dataContextPath = input<string>('/');

  color = computed(() => this.props()['color']?.value());
  iconNameRaw = computed(() => this.props()['name']?.value());

  isPath = computed(() => {
    const name = this.iconNameRaw();
    return typeof name === 'object' && name !== null && 'path' in name;
  });

  path = computed(() => {
    const name = this.iconNameRaw();
    return (name as any)?.path || '';
  });

  iconName = computed(() => {
    const name = this.iconNameRaw();
    if (typeof name !== 'string') return '';
    // Convert camelCase to snake_case for Material Icons
    return name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  });
}
