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

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Angular implementation of the A2UI Text component (v0.9).
 */
@Component({
  selector: 'a2ui-v09-text',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [style.font-weight]="props.weight?.value()" [style.font-style]="props.style?.value()">
      {{ props.text?.value() }}
    </span>
  `,
  // Default change detection to allow passive updates from Preact signals
})
export class TextComponent {
  /**
   * Bound properties.
   */
  @Input() props: any = {};
  @Input() surfaceId?: string;
  @Input() componentId?: string;
  @Input() dataContextPath?: string;
}
