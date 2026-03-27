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
  signal,
  computed,
  Signal,
  WritableSignal,
  isSignal,
  effect,
} from '@angular/core';

import {FrameworkSignal} from './signals.js';
import {runFrameworkSignalTests} from './signals-testing.shared.js';

declare module './signals.js' {
  interface SignalKinds<T> {
    readonly: Signal<T>;
    writable: WritableSignal<T>;
  }
}

// Test FrameworkSignal with Angular signals explicitly mapped over SignalKinds.
const AngularSignal = {
  computed: <T>(fn: () => T) => computed(fn),
  isSignal: (val: unknown): val is Signal<any> => isSignal(val),
  wrap: <T>(val: T) => signal(val),
  unwrap: <T>(val: Signal<T>) => val(),
  set: <T>(sig: WritableSignal<T>, value: T) => sig.set(value),
  effect: (fn: () => void, cleanupCallback: () => void) => {
    const e = effect(cleanupRegisterFn => {
      cleanupRegisterFn(cleanupCallback);
      fn();
    });
    return () => e.destroy();
  },
} satisfies FrameworkSignal;

runFrameworkSignalTests('Angular implementation', AngularSignal);
