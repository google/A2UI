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

import { Injectable } from '@angular/core';
import { z } from 'zod';
import { BaseMinimalCatalog, MINIMAL_COMPONENTS, MINIMAL_FUNCTIONS } from '@a2ui/angular/v0_9';
import { CustomSliderComponent } from './custom-slider.component';
import { CardComponent } from './card.component';
import { AngularComponentApi } from '@a2ui/angular/v0_9';
import { BASIC_FUNCTIONS } from '@a2ui/web_core/v0_9/basic_catalog';

/**
 * A catalog specific to the demo, extending the minimal catalog with custom components.
 */
@Injectable({
  providedIn: 'root',
})
export class DemoCatalog extends BaseMinimalCatalog {
  constructor() {
    const customSliderApi: AngularComponentApi = {
      name: 'CustomSlider',
      schema: z.object({
        label: z.string().optional(),
        value: z.number().optional(),
        min: z.number().optional(),
        max: z.number().optional(),
      }) as any,
      component: CustomSliderComponent,
    };

    const cardApi: AngularComponentApi = {
      name: 'Card',
      schema: z.object({
        child: z.string().optional(),
      }) as any,
      component: CardComponent,
    };

    const components = [...MINIMAL_COMPONENTS, customSliderApi, cardApi];
    const functions = [...BASIC_FUNCTIONS, ...MINIMAL_FUNCTIONS];

    super(
      'https://a2ui.org/specification/v0_9/catalogs/minimal/minimal_catalog.json',
      components,
      functions,
    );
  }
}
