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

import { inject, provide, type InjectionKey } from 'vue';
import type { Catalog } from './rendering/catalog';
import * as Types from '@a2ui/web_core/types/types';

export interface A2UIConfig {
  catalog: Catalog;
  theme: Types.Theme;
}

export const A2UI_CONFIG_KEY: InjectionKey<A2UIConfig> = Symbol('a2ui-config');

export function provideA2UI(config: A2UIConfig): void {
  provide(A2UI_CONFIG_KEY, config);
}

export function useA2UIConfig(): A2UIConfig {
  const config = inject(A2UI_CONFIG_KEY);
  if (!config) {
    throw new Error('A2UI config not provided. Please call provideA2UI() in a parent component.');
  }
  return config;
}
