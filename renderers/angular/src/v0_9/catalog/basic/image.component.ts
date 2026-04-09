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
 * Angular implementation of the A2UI Image component (v0.9).
 *
 * Renders an image with configurable fit and shape variants.
 */
@Component({
  selector: 'a2ui-v09-image',
  standalone: true,
  imports: [],
  template: `
    <img
      [src]="url()"
      [alt]="description()"
      [style.object-fit]="fit()"
      [class]="'a2ui-image ' + variant()"
    />
  `,
  styles: [
    `
      .a2ui-image {
        display: block;
        max-width: 100%;
        height: auto;
      }
      .a2ui-image.circle {
        border-radius: 50%;
        aspect-ratio: 1 / 1;
      }
      .a2ui-image.rounded {
        border-radius: 8px;
      }
      .a2ui-image.icon {
        width: 24px;
        height: 24px;
      }
      .a2ui-image.avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
      }
      .a2ui-image.smallFeature {
        width: 100px;
        height: 100px;
      }
      .a2ui-image.mediumFeature {
        max-width: 300px;
        height: auto;
      }
      .a2ui-image.largeFeature {
        width: 100%;
        max-height: 400px;
      }
      .a2ui-image.header {
        width: 100%;
        height: 200px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageComponent {
  /**
   * Reactive properties resolved from the A2UI {@link ComponentModel}.
   *
   * Expected properties:
   * - `url`: The absolute URL of the image.
   * - `description`: Accessibility text for the image.
   * - `fit`: Object-fit mode ('cover', 'contain', 'fill', 'none', 'scale-down').
   * - `variant`: Style variant ('default', 'circle', 'rounded', 'icon', 'avatar', 'smallFeature', 'mediumFeature', 'largeFeature', 'header').
   */
  props = input<Record<string, BoundProperty>>({});
  surfaceId = input.required<string>();
  componentId = input<string>();
  dataContextPath = input<string>('/');

  url = computed(() => this.props()['url']?.value());
  description = computed(() => this.props()['description']?.value() || '');
  fit = computed(() => this.props()['fit']?.value() || 'cover');
  variant = computed(() => this.props()['variant']?.value() || 'default');
}
