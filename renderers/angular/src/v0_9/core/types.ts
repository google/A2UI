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

import { Signal } from '@angular/core';

/**
 * Represents a component property bound to an Angular Signal and update logic.
 *
 * This interface is used by {@link ComponentBinder} to expose properties to
 * Angular components. It contains the current value as a Signal, the raw
 * property definition, and an update function.
 *
 * @template T The type of the property value.
 */
export interface BoundProperty<T = any> {
  /**
   * The reactive Angular Signal containing the current resolved value.
   *
   * This signal automatically updates whenever the underlying A2UI data
   * model changes.
   */
  readonly value: Signal<T>;

  /**
   * The raw value from the A2UI ComponentModel.
   *
   * This may be a literal value or a data binding path object.
   */
  readonly raw: any;

  /**
   * Callback to update the value in the A2UI DataContext.
   *
   * If the property is bound to a path in the data model, calling this
   * will update that path. If the property is a literal value, this
   * is typically a no-op.
   */
  readonly onUpdate: (newValue: T) => void;
}
