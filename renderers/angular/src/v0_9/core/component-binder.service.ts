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
import { ComponentContext } from '@a2ui/web_core/v0_9';
import { BoundProperty } from './types';

/**
 * Binds A2UI ComponentModel properties to reactive Angular Signals.
 *
 * This service is used by {@link ComponentHostComponent} to resolve data bindings
 * from the A2UI DataContext and expose them as Angular Signals. It ensures that
 * property updates from the A2UI protocol are correctly reflected in Angular
 * components and provides callbacks for updating the data model.
 */
@Injectable({
  providedIn: 'root',
})
export class ComponentBinder {
  constructor() {}

  /**
   * Binds all properties of a component to an object of Angular Signals.
   *
   * @param context The ComponentContext containing the model and data context.
   * @returns An object where each key corresponds to a component prop and its value is an Angular Signal.
   */
  bind(context: ComponentContext): Record<string, BoundProperty> {
    const props = context.componentModel.properties;
    const bound: Record<string, BoundProperty> = {};

    for (const key of Object.keys(props)) {
      const value = props[key];
      const sig = context.dataContext.resolveSignal(value);

      // Augment the signal into a BoundProperty
      const isBoundPath = value && typeof value === 'object' && 'path' in value;
      
      const boundProp = sig as any as BoundProperty;
      
      // Defensively define properties only if they don't already exist or are configurable
      const defineSafe = (obj: any, key: string, descriptor: PropertyDescriptor) => {
        const existing = Object.getOwnPropertyDescriptor(obj, key);
        if (!existing || existing.configurable) {
          Object.defineProperty(obj, key, descriptor);
        }
      };

      defineSafe(boundProp, 'raw', { value: value, configurable: true });

      // Defensively define properties to avoid "Cannot redefine property" errors
      try {
        Object.defineProperty(boundProp, 'name', {
          value: key,
          configurable: true,
          writable: true,
          enumerable: true
        });
      } catch (e) {
        console.warn(`Failed to define "name" property on bound signal for "${key}":`, e);
      }
      
      // Only define 'set' if we have a path-bound property to handle
      if (isBoundPath) {
        defineSafe(boundProp, 'set', {
          value: (newValue: any) => context.dataContext.set(value.path, newValue),
          configurable: true
        });
      }

      bound[key] = boundProp;
    }

    return bound;
  }
}
