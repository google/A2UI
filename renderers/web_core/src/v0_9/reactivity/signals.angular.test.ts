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
  signal,
  computed,
  isSignal,
  effect,
  Signal as NgSignal,
  WritableSignal as NgWritableSignal,
} from '@angular/core';

import {FrameworkSignal} from './signals.js';
import {runFrameworkSignalTests} from './signals-testing.shared.js';

declare module './signals.js' {
  // Setup the appropriate types for Angular Signals
  interface SignalKinds<T> {
    // @ts-ignore : Suppress cross-compilation interface overlap
    readonly: NgSignal<T>;
    // @ts-ignore : Suppress cross-compilation interface overlap
    writable: NgWritableSignal<T>;
  }
}

// Test FrameworkSignal with Angular signals explicitly mapped over SignalKinds.
const AngularSignal = {
  computed: <T>(fn: () => T) => computed(fn),
  isSignal: (val: unknown): val is NgSignal<any> => isSignal(val),
  wrap: <T>(val: T) => signal(val),
  unwrap: <T>(val: NgSignal<T>) => val(),
  set: <T>(sig: NgWritableSignal<T>, value: T) => sig.set(value),
  effect: (fn: () => void, cleanupCallback: () => void) => {
    const e = effect(cleanupRegisterFn => {
      cleanupRegisterFn(cleanupCallback);
      fn();
    });
    return () => e.destroy();
  },
} as unknown as FrameworkSignal; // Bypass Mono-compilation interface overlap
// The cast above is needed because tsc is merging all our test files together,
// and the SignalKinds interface is being declared multiple times, causing a
// type collision. Normally, the AngularSignal would `satisfies FrameworkSignal`,
// and the declaration of SignalKinds wouldn't need to suppress anything.

runFrameworkSignalTests('Angular implementation', AngularSignal);
