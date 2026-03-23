import { effect, type Signal as PreactSignal } from '@a2ui/web_core/v0_9';

/**
 * Bridges a Preact Signal (from @a2ui/web_core) to a Svelte 5 reactive value.
 *
 * Creates a `$state` variable that tracks the signal, with proper cleanup
 * of both the Preact effect and any internal signal subscriptions (e.g.,
 * AbortControllers on computed signals from DataContext.resolveSignal).
 *
 * MUST be called within a Svelte component's `<script>` block (needs rune context).
 *
 * @param preactSignal The source Preact Signal from web_core's DataContext.
 * @returns An object with a reactive `value` getter.
 */
export function fromSignal<T>(preactSignal: PreactSignal<T>): { readonly value: T } {
  let current = $state<T>(preactSignal.peek());

  $effect(() => {
    // Subscribe to Preact signal changes and push into Svelte $state
    const dispose = effect(() => {
      current = preactSignal.value;
    });

    // Cleanup: dispose the Preact effect + any internal signal subscriptions
    return () => {
      dispose();
      disposeSignal(preactSignal);
    };
  });

  return {
    get value() {
      return current;
    },
  };
}

/**
 * Cleans up a Preact Signal that may have an internal `.unsubscribe()` method.
 *
 * web_core's `DataContext.resolveSignal()` attaches `.unsubscribe()` to signals
 * that wrap computed values with AbortControllers (see data-context.ts:253).
 * This is a documented pattern in web_core, not a hack.
 */
export function disposeSignal(signal: any): void {
  if (signal && typeof signal.unsubscribe === 'function') {
    signal.unsubscribe();
  }
}
