// @ts-nocheck
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

import {
  Signal,
  computed,
  effect,
} from '@preact/signals-core';

import {FrameworkSignal} from './signals.js';
import {runFrameworkSignalTests} from './signals-testing.shared.js';

declare module './signals.js' {
  interface SignalKinds<T> {
    readonly: Signal<T>;
    writable: Signal<T>;
  }
}

// Test FrameworkSignal with Preact signals explicitly mapped over SignalKinds.
const PreactSignal = {
  computed: <T>(fn: () => T) => computed(fn),
  isSignal: (val: unknown): val is Signal<any> => val instanceof Signal,
  wrap: <T>(val: T) => new Signal(val),
  unwrap: <T>(val: Signal<T>) => val.value,
  set: <T>(sig: Signal<T>, value: T) => (sig.value = value),
  effect: (fn: () => void) => effect(fn),
} satisfies FrameworkSignal;

runFrameworkSignalTests('Preact implementation', PreactSignal);
