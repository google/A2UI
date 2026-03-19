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

import { DestroyRef, Injectable, inject, NgZone } from '@angular/core';
import { ComponentContext } from '@a2ui/web_core/v0_9';
import { toAngularSignal } from './utils';
import { BoundProperty } from './types';

/**
 * Binds A2UI ComponentModel properties to reactive Angular Signals.
 *
 * This service resolves data bindings from the A2UI DataContext and exposes them
 * as Angular Signals for use in renderer components.
 */
@Injectable({
  providedIn: 'root',
})
export class ComponentBinder {
  private destroyRef = inject(DestroyRef);
  private ngZone = inject(NgZone);

  /**
   * Binds all properties of a component to an object of Angular Signals.
   *
   * @param context The ComponentContext containing the model and data context.
   * @returns An object where each key corresponds to a component prop and its value is an Angular Signal.
   */
  bind(context: ComponentContext): Record<string, BoundProperty> {
    const props = context.componentModel.properties;
    const bound: Record<string, any> = {};

    for (const key of Object.keys(props)) {
      const value = props[key];
      const preactSig = context.dataContext.resolveSignal(value);
      const angSig = toAngularSignal(preactSig as any, this.destroyRef, this.ngZone);

      const isBoundPath = value && typeof value === 'object' && 'path' in value;

      bound[key] = {
        value: angSig,
        raw: value,
        onUpdate: isBoundPath
          ? (newValue: any) => context.dataContext.set(value.path, newValue)
          : () => {}, // No-op for non-bound values
      };
    }

    return bound;
  }
}
