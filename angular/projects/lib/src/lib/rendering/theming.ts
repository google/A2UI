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

import { v0_8 } from '@a2ui/web-lib';
import { InjectionToken } from '@angular/core';

export const Theme = new InjectionToken<Theme>('Theme');

export type Theme = v0_8.Types.Theme;

export function themeMerge(...classes: Array<Record<string, boolean>>) {
  // TODO: de-duplicate this function with Lit.
  const styles: Record<string, boolean> = {};
  for (const clazz of classes) {
    for (const [key, val] of Object.entries(clazz)) {
      const keys = key.split('-');
      keys[keys.length - 1] = '';
      const prefix = keys.join('-');
      const existingKeys = Object.keys(styles).filter((key) => key.startsWith(prefix));

      for (const existingKey of existingKeys) {
        delete styles[existingKey];
      }

      styles[key] = val;
    }
  }

  return styles;
}
