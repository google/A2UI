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
