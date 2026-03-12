import React, { useRef, useSyncExternalStore, useCallback } from "react";
import { z } from "zod";
import { ComponentContext, GenericBinder } from "@a2ui/web_core/v0_9";
import type { ComponentApi, ResolveA2uiProps } from "@a2ui/web_core/v0_9";

export interface ReactComponentImplementation extends ComponentApi {
  /** The framework-specific rendering wrapper. */
  render: React.FC<{
    context: ComponentContext;
    buildChild: (id: string, basePath?: string) => React.ReactNode;
  }>;
}

export type ReactA2uiComponentProps<T> = {
  props: T;
  buildChild: (id: string, basePath?: string) => React.ReactNode;
  context: ComponentContext;
};

// --- Component Factories ---

/**
 * Creates a React component implementation using the deep generic binder.
 */
export function createReactComponent<Schema extends z.ZodTypeAny>(
  api: { name: string; schema: Schema },
  RenderComponent: React.FC<ReactA2uiComponentProps<ResolveA2uiProps<z.infer<Schema>>>>
): ReactComponentImplementation {
  type Props = ResolveA2uiProps<z.infer<Schema>>;
  
  const ReactWrapper: React.FC<{ context: ComponentContext, buildChild: any }> = ({ context, buildChild }) => {
    const bindingRef = useRef<GenericBinder<Props>>(null);

    if (!bindingRef.current) {
      bindingRef.current = new GenericBinder<Props>(context, api.schema);
    }
    const binding = bindingRef.current;

    const subscribe = useCallback((callback: () => void) => {
      const sub = binding.subscribe(callback);
      return () => sub.unsubscribe();
    }, [binding]);

    const getSnapshot = useCallback(() => binding.snapshot, [binding]);
    const props = useSyncExternalStore(subscribe, getSnapshot);

    return <RenderComponent props={props || ({} as Props)} buildChild={buildChild} context={context} />;
  };

  return {
    name: api.name,
    schema: api.schema,
    render: ReactWrapper
  };
}

/**
 * Creates a React component implementation that manages its own context bindings (no generic binder).
 */
export function createBinderlessComponent(
  api: ComponentApi,
  RenderComponent: React.FC<{
    context: ComponentContext;
    buildChild: (id: string, basePath?: string) => React.ReactNode;
  }>
): ReactComponentImplementation {
  return {
    name: api.name,
    schema: api.schema,
    render: RenderComponent
  };
}
