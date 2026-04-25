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

import { Directive, computed, HostBinding, input, inject } from '@angular/core';
import { injectBasicCatalogStyles } from '@a2ui/web_core/v0_9/basic_catalog';
import { BoundProperty } from '../../core/types';
import { A2uiRendererService } from '../../core/a2ui-renderer.service';

/**
 * Base class for A2UI basic catalog components in Angular.
 *
 * Automatically injects the basic catalog styles when the component is instantiated.
 * Also binds the primary brand color to the host element.
 */
@Directive()
export abstract class BasicCatalogComponent {
  /**
   * Reactive properties resolved from the A2UI ComponentModel.
   */
  props = input<Record<string, BoundProperty>>({});

  surfaceId = input.required<string>();
  componentId = input.required<string>();
  dataContextPath = input<string>('/');

  protected rendererService = inject(A2uiRendererService);

  readonly surface = computed(() => {
    return this.rendererService.surfaceGroup.getSurface(this.surfaceId());
  });

  readonly theme = computed(() => {
    return this.surface()?.theme;
  });

  readonly primaryColor = computed(() => {
    return this.theme()?.primaryColor;
  });

  /**
   * Computes the weight of the component from the properties.
   */
  protected readonly weight = computed(() => this.props()['weight']?.value() ?? null);

  constructor() {
    injectBasicCatalogStyles();
  }

  /**
   * Binds the flex style to the host element based on the weight.
   */
  @HostBinding('style.flex')
  get flexStyle() {
    return this.weight() !== null ? `${this.weight()}` : null;
  }

  @HostBinding('style.--a2ui-color-primary')
  get primaryColorStyle(): string | null {
    return this.primaryColor() || null;
  }
}

