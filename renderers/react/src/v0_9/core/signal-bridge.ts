import { useSyncExternalStore, useRef, useCallback } from 'react';
import { effect, type Signal as PreactSignal } from '@a2ui/web_core/v0_9';

/**
 * Bridges a Preact Signal to React's rendering cycle via useSyncExternalStore.
 *
 * Subscribes to the Preact Signal and triggers React re-renders when the value changes.
 * Automatically cleans up the subscription when the component unmounts.
 *
 * @param preactSignal The source Preact Signal from web_core's DataContext.
 * @returns The current value of the signal (reactive — triggers re-render on change).
 */
export function usePreactSignal<T>(preactSignal: PreactSignal<T>): T {
  const signalRef = useRef(preactSignal);
  signalRef.current = preactSignal;

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const dispose = effect(() => {
        signalRef.current.value; // Track the signal
        onStoreChange();
      });

      return () => {
        dispose();
        if ((signalRef.current as any).unsubscribe) {
          (signalRef.current as any).unsubscribe();
        }
      };
    },
    [], // stable reference
  );

  const getSnapshot = useCallback(() => signalRef.current.peek(), []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
