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

/**
 * A generalized interface for a reactive primitive (a \"signal\").
 * It represents a value that can be read, but it also has a .value property
 * for direct access (like Preact signals).
 */
export interface GenericSignal<T = any> {
  /** The current value (accessor). Functions as a getter/setter. */
  value: T;

  /**
   * Invoking the signal as a function returns its current value.
   * This is compatible with both Preact and Angular signals.
   */
  (): T;

  /** Reads the value without creating a reactive dependency. */
  peek(): T;
}

/**
 * An abstraction for creating reactive primitives and observing changes.
 * This allows web_core to be agnostic to the underlying signal implementation.
 */
export interface ReactiveProvider {
  /** Creates a reactive signal. */
  signal<T>(value: T): GenericSignal<T>;

  /** Creates a computed signal based on other signals. */
  computed<T>(compute: () => T): GenericSignal<T>;

  /**
   * Runs an effect that automatically tracks and re-executes when its signal
   * dependencies change.
   * @returns A cleanup function to stop the effect.
   */
  effect(callback: () => void): () => void;

  /**
   * Batches multiple signal updates so that effects and computations are
   * triggered only once at the end of the batch.
   */
  batch<T>(callback: () => T): T;
}
