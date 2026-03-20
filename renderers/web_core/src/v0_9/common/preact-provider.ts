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

import { signal, computed, effect, batch, Signal } from '@preact/signals-core';
import { GenericSignal, ReactiveProvider } from './reactive';

/**
 * Bridges Preact signals to the GenericSignal interface.
 */
function wrapPreactSignal<T>(sig: Signal<T>): GenericSignal<T> {
  // A Preact signal already acts as a GenericSignal if we treat it right.
  // It has a .value property and a .peek() method.
  // We just need to make it callable as a function sig() for Angular compatibility.
  const wrapper = () => sig.value;
  Object.defineProperties(wrapper, {
    value: {
      get: () => sig.value,
      set: (v: T) => {
        sig.value = v;
      },
    },
    peek: {
      value: () => sig.peek(),
    },
    // We add this to easily detect it as a signal in catalog code.
    _isGenericSignal: { value: true },
  });
  return wrapper as any as GenericSignal<T>;
}

/**
 * A ReactiveProvider that uses @preact/signals-core as its backend.
 */
export class PreactReactiveProvider implements ReactiveProvider {
  signal<T>(value: T): GenericSignal<T> {
    return wrapPreactSignal(signal(value));
  }

  computed<T>(compute: () => T): GenericSignal<T> {
    return wrapPreactSignal(computed(compute));
  }

  effect(callback: () => void): () => void {
    return effect(callback);
  }

  batch<T>(callback: () => T): T {
    return batch(callback);
  }
}
