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

import {computed, effect, Signal as PSignal} from '@preact/signals-core';

import {FrameworkSignal} from './signals.js';
import {runFrameworkSignalTests} from './signals-testing.shared.js';

declare module './signals.js' {
  interface SignalKinds<T> {
    // @ts-ignore : Suppress cross-compilation interface overlap
    readonly: PSignal<T>;
    // @ts-ignore : Suppress cross-compilation interface overlap
    writable: PSignal<T>;
  }
}

// Test FrameworkSignal with Preact signals explicitly mapped over SignalKinds.
const PreactSignal = {
  computed: <T>(fn: () => T) => computed(fn),
  isSignal: (val: unknown): val is PSignal<any> => val instanceof PSignal,
  wrap: <T>(val: T) => new PSignal(val),
  unwrap: <T>(val: PSignal<T>) => val.value,
  set: <T>(sig: PSignal<T>, value: T) => (sig.value = value),
  effect: (fn: () => void) => effect(fn),
} as unknown as FrameworkSignal; // Cast bypasses Mono-compilation interface overlap
// The cast above is needed because tsc is merging all our test files together,
// and the SignalKinds interface is being declared multiple times, causing a
// type collision. Normally, the AngularSignal would `satisfies FrameworkSignal`,
// and the declaration of SignalKinds wouldn't need to suppress anything.

runFrameworkSignalTests('Preact implementation', PreactSignal);
