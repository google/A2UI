import React, { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import { Types } from '@a2ui/lit/0.8';
import { MessageProcessor } from './MessageProcessor';

export interface A2UIContextValue {
  processor: MessageProcessor;
  surfaces: ReadonlyMap<string, Types.Surface>;
}

const A2UIContext = createContext<A2UIContextValue | null>(null);

export interface A2UIProviderProps {
  processor: MessageProcessor;
  children: React.ReactNode;
}

/**
 * A2UI Context Provider that manages the message processor and surfaces state.
 */
export function A2UIProvider({ processor, children }: A2UIProviderProps) {
  // Create a subscription-based store for surfaces
  const surfaces = useSyncExternalStore(
    (callback) => {
      // Subscribe to processor changes by polling
      // In a real implementation, the processor would emit change events
      const interval = setInterval(callback, 100);
      return () => clearInterval(interval);
    },
    () => processor.getSurfaces(),
    () => processor.getSurfaces()
  );

  const value = useMemo<A2UIContextValue>(
    () => ({ processor, surfaces }),
    [processor, surfaces]
  );

  return (
    <A2UIContext.Provider value={value}>
      {children}
    </A2UIContext.Provider>
  );
}

/**
 * Hook to access the A2UI context.
 */
export function useA2UIContext(): A2UIContextValue {
  const context = useContext(A2UIContext);
  if (!context) {
    throw new Error('useA2UIContext must be used within an A2UIProvider');
  }
  return context;
}
