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
import { createFunctionImplementation } from '@a2ui/web_core/v0_9';
import { AngularCatalog, AngularComponentImplementation } from '../types';
import { TextComponent } from './text.component';
import { RowComponent } from './row.component';
import { ColumnComponent } from './column.component';
import { ButtonComponent } from './button.component';
import { TextFieldComponent } from './text-field.component';
import {
  TextApi,
  RowApi,
  ColumnApi,
  ButtonApi,
  TextFieldApi,
} from '@a2ui/web_core/v0_9/basic_catalog';
import { FunctionImplementation } from '@a2ui/web_core/v0_9';
import { FormatStringImplementation } from '@a2ui/web_core/v0_9/basic_catalog';

export const MINIMAL_COMPONENTS: AngularComponentImplementation[] = [
  { ...TextApi, component: TextComponent },
  { ...RowApi, component: RowComponent },
  { ...ColumnApi, component: ColumnComponent },
  { ...ButtonApi, component: ButtonComponent },
  { ...TextFieldApi, component: TextFieldComponent },
];

export const MINIMAL_FUNCTIONS: FunctionImplementation[] = [
  createFunctionImplementation(
    {
      name: 'capitalize',
      returnType: 'string',
      schema: z.object({ value: z.string().optional() }),
    },
    (args) => {
      console.log('[MinimalCatalog] capitalize called with args:', args);
      const value = String(args.value || '');
      const res = value.charAt(0).toUpperCase() + value.slice(1);
      console.log('[MinimalCatalog] capitalize result:', res);
      return res;
    },
  ),
  FormatStringImplementation,
];

/**
 * Provides a base implementation for catalogs that include minimal components.
 */
export class BaseMinimalCatalog extends AngularCatalog {
  constructor(
    id: string = 'minimal',
    components: AngularComponentImplementation[] = MINIMAL_COMPONENTS,
    functions: FunctionImplementation[] = MINIMAL_FUNCTIONS,
  ) {
    super(id, components, functions);
  }
}

/**
 * Defines a minimal catalog of components and functions for A2UI v0.9.
 *
 * This catalog includes basic layout (Row, Column) and UI elements (Text, Button, TextField)
 * along with standard functions like string formatting.
 */
@Injectable({
  providedIn: 'root',
})
export class MinimalCatalog extends BaseMinimalCatalog {
  constructor() {
    super();
  }
}
