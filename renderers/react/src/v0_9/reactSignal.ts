import {type FrameworkSignal} from '@a2ui/web_core/v0_9';
import {Signal, computed, effect} from '@preact/signals-core';

declare module '@a2ui/web_core/v0_9' {
  interface SignalKinds<T> {
    react: Signal<T>;
  }
  interface WritableSignalKinds<T> {
    react: Signal<T>;
  }
}

/**
 * A FrameworkSignal implementation that wraps Preact signals.
 */
export const reactSignal: FrameworkSignal<'react'> = {
  computed: <T>(fn: () => T) => computed<T>(fn),
  isSignal: (val: unknown) => val instanceof Signal,
  wrap: <T>(val: T) => new Signal<T>(val),
  unwrap: <T>(val: Signal<T>) => val.value,
  set: <T>(signal: Signal<T>, value: T) => (signal.value = value),
  effect: (fn: () => void) => effect(fn),
};
