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

import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { BoundProperty } from '../../core/types';

/**
 * A basic text component that supports font weights and styles.
 */
@Component({
  selector: 'a2ui-v09-text',
  imports: [],
  template: `
    <span
      [style.font-weight]="fontWeight()"
      [style.font-style]="fontStyle()"
    >
      {{ text() }}
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextComponent {
  /**
   * Bound properties.
   */
  props = input<Record<string, BoundProperty>>({});
  surfaceId = input<string>();
  componentId = input<string>();
  dataContextPath = input<string>();

  text = computed(() => this.props()['text']?.value() ?? '');
  fontWeight = computed(() => this.props()['weight']?.value());
  fontStyle = computed(() => this.props()['style']?.value());
}
