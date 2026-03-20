/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the \"License\");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an \"AS IS\" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { signal, computed, effect, untracked, Injector, runInInjectionContext } from '@angular/core';
import { GenericSignal, ReactiveProvider } from '@a2ui/web_core/v0_9';

/**
 * Bridges Angular signals to the GenericSignal interface.
 */
function wrapAngularSignal<T>(sig: any): GenericSignal<T> {
  // sig is a function in Angular.
  // We need to add a .value property and .peek() method.
  const wrapper = () => sig();
  
  Object.defineProperties(wrapper, {
    value: {
      get: () => sig(),
      set: (v: T) => {
        if (typeof sig.set === 'function') {
          sig.set(v);
        } else {
          console.warn('Cannot set value on a computed Angular signal.');
        }
      },
    },
    peek: {
      value: () => untracked(() => sig()),
    },
    // Add set method for direct access as well
    set: {
      value: (v: T) => sig.set?.(v),
    },
    _isGenericSignal: { value: true },
  });
  
  return wrapper as any as GenericSignal<T>;
}

/**
 * A ReactiveProvider that uses Angular's native signals as its backend.
 */
export class AngularReactiveProvider implements ReactiveProvider {
  constructor(private injector: Injector) {}

  signal<T>(value: T): GenericSignal<T> {
    return wrapAngularSignal(signal(value));
  }

  computed<T>(compute: () => T): GenericSignal<T> {
    return wrapAngularSignal(computed(compute));
  }

  effect(callback: () => void): () => void {
    const effectRef = runInInjectionContext(this.injector, () => {
      return effect(() => {
        callback();
      });
    });
    return () => effectRef.destroy();
  }

  batch<T>(callback: () => T): T {
    // Angular doesn't have an explicit global `batch` like Preact, 
    // but signal updates are generally batched by the change detection cycle.
    // For now, we just execute the callback.
    return callback();
  }
}
