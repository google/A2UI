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

import {Signal, computed, effect} from '@preact/signals-core';
import {FrameworkSignal} from '../reactivity/signals.js';

declare module '../reactivity/signals' {
  interface SignalKinds<T> {
    preact: Signal<T>;
  }
  interface WritableSignalKinds<T> {
    preact: Signal<T>;
  }
}

/**
 * Simple implementation of FrameworkSignal for use in tests.
 */
export const testFrameworkSignal: FrameworkSignal<'preact'> = {
  computed: <T>(fn: () => T) => computed(fn),
  effect: (fn: () => void) => effect(fn),
  isSignal: (val: unknown) => val instanceof Signal,
  wrap: <T>(val: T) => new Signal<T>(val),
  unwrap: <T>(val: Signal<T>) => val.value,
  set: <T>(signal: Signal<T>, value: T) => {
    signal.value = value;
  },
};
