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

import { Signal, WritableSignal } from '@angular/core';
import { GenericSignal } from '@a2ui/web_core/v0_9';

/**
 * A BoundProperty is a reactive signal that represents a component property
 * from the A2UI component tree.
 *
 * Components can read the current value by calling the property as a function: `props().key()`.
 * If the property is bound to a data path, it also supports `.set(newValue)` to update the model.
 *
 * @template T The type of the property value.
 */
export type BoundProperty<T = any> = (Signal<T> | WritableSignal<T> | GenericSignal<T>) & {
  /** The raw property definition from the component model (literal or binding). */
  readonly raw: any;
  /** Direct access to the current value (same as calling the signal function). */
  readonly value: Signal<T>;
  /** Updates the underlying data model if the property is path-bound. */
  readonly set: (value: T) => void;
};
