import React, { createContext, useContext, useRef, useEffect, useMemo } from 'react';
import {
  MessageProcessor,
  type Catalog,
  type ComponentApi,
  type SurfaceGroupModel,
} from '@a2ui/web_core/v0_9';
import type { ComponentRegistry } from './types.js';

interface A2UIContextValue {
  surfaceGroup: SurfaceGroupModel<ComponentApi>;
  processMessages: (messages: any[]) => void;
  clearSurfaces: () => void;
  registry: ComponentRegistry;
}

const A2UIContext = createContext<A2UIContextValue | null>(null);

export interface A2UIProviderProps {
  /** The component catalogs defining available A2UI components and functions. */
  catalogs: Catalog<ComponentApi>[];
  /** The component registry mapping type names to React components. */
  registry: ComponentRegistry;
  /** Called when a component dispatches an action (receives A2uiClientAction). */
  onAction?: (action: any) => void;
  children: React.ReactNode;
}

/**
 * Provides A2UI context to all descendant components.
 *
 * Wrap your app (or the portion that uses A2UI) with this provider.
 *
 * @example
 * ```tsx
 * <A2UIProvider catalogs={[catalog]} registry={registry} onAction={handleAction}>
 *   <Surface surfaceId="main" />
 * </A2UIProvider>
 * ```
 */
export function A2UIProvider({ catalogs, registry, onAction, children }: A2UIProviderProps) {
  const processorRef = useRef<MessageProcessor<ComponentApi>>(null!);

  if (!processorRef.current) {
    processorRef.current = new MessageProcessor(catalogs);
  }

  useEffect(() => {
    const model = processorRef.current.model;

    const actionSub = model.onAction.subscribe((event) => {
      onAction?.(event);
    });

    return () => {
      actionSub.unsubscribe();
      model.dispose();
    };
  }, []);

  const value = useMemo<A2UIContextValue>(
    () => ({
      surfaceGroup: processorRef.current.model,
      processMessages: (messages: any[]) => processorRef.current.processMessages(messages),
      clearSurfaces: () => processorRef.current.model.dispose(),
      registry,
    }),
    [registry],
  );

  return <A2UIContext.Provider value={value}>{children}</A2UIContext.Provider>;
}

/**
 * Hook to access the A2UI context (surfaceGroup, processMessages, etc.).
 */
export function useA2UI(): A2UIContextValue {
  const ctx = useContext(A2UIContext);
  if (!ctx) throw new Error('useA2UI must be used within an <A2UIProvider>');
  return ctx;
}
