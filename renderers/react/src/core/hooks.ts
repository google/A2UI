import { useCallback, useMemo } from 'react';
import { Types, Primitives } from '@a2ui/lit/0.8';
import { useA2UIContext } from './A2UIProvider';
import { MessageProcessor } from './MessageProcessor';

/**
 * Hook to get the message processor instance.
 */
export function useProcessor(): MessageProcessor {
  const { processor } = useA2UIContext();
  return processor;
}

/**
 * Hook to get a specific surface by ID.
 */
export function useSurface(surfaceId: string): Types.Surface | null {
  const { surfaces } = useA2UIContext();
  return surfaces.get(surfaceId) ?? null;
}

/**
 * Hook to resolve a primitive value (string, number, boolean) from either
 * a literal value or a data binding path.
 */
export function useDataBinding<T extends string | number | boolean>(
  value: Primitives.StringValue | Primitives.NumberValue | Primitives.BooleanValue | null | undefined,
  component: Types.AnyComponentNode,
  surfaceId: string | null
): T | null {
  const { processor } = useA2UIContext();

  return useMemo(() => {
    if (!value || typeof value !== 'object') {
      return null;
    }

    // Check for literal values first
    if ('literal' in value && value.literal != null) {
      return value.literal as T;
    }
    if ('literalString' in value && value.literalString != null) {
      return value.literalString as T;
    }
    if ('literalNumber' in value && value.literalNumber != null) {
      return value.literalNumber as T;
    }
    if ('literalBoolean' in value && value.literalBoolean != null) {
      return value.literalBoolean as T;
    }

    // Resolve path binding
    if ('path' in value && value.path) {
      const resolvedValue = processor.getData(
        component,
        value.path,
        surfaceId ?? undefined
      );
      if (resolvedValue != null) {
        return resolvedValue as T;
      }
    }

    return null;
  }, [value, component, surfaceId, processor]);
}

/**
 * Hook to resolve a string value.
 */
export function useStringBinding(
  value: Primitives.StringValue | null | undefined,
  component: Types.AnyComponentNode,
  surfaceId: string | null
): string | null {
  return useDataBinding<string>(value, component, surfaceId);
}

/**
 * Hook to resolve a number value.
 */
export function useNumberBinding(
  value: Primitives.NumberValue | null | undefined,
  component: Types.AnyComponentNode,
  surfaceId: string | null
): number | null {
  return useDataBinding<number>(value, component, surfaceId);
}

/**
 * Hook to resolve a boolean value.
 */
export function useBooleanBinding(
  value: Primitives.BooleanValue | null | undefined,
  component: Types.AnyComponentNode,
  surfaceId: string | null
): boolean | null {
  return useDataBinding<boolean>(value, component, surfaceId);
}

/**
 * Hook to create an action handler for button clicks and other user actions.
 */
export function useAction(
  action: Types.Action | null | undefined,
  component: Types.AnyComponentNode,
  surfaceId: string | null
) {
  const { processor } = useA2UIContext();

  return useCallback(async () => {
    if (!action) return;

    const context: Record<string, unknown> = {};

    // Resolve action context values
    if (action.context) {
      for (const item of action.context) {
        if (item.value.literalBoolean != null) {
          context[item.key] = item.value.literalBoolean;
        } else if (item.value.literalNumber != null) {
          context[item.key] = item.value.literalNumber;
        } else if (item.value.literalString != null) {
          context[item.key] = item.value.literalString;
        } else if (item.value.path) {
          const path = processor.resolvePath(item.value.path, component.dataContextPath);
          const value = processor.getData(component, path, surfaceId ?? undefined);
          context[item.key] = value;
        }
      }
    }

    const message: Types.A2UIClientEventMessage = {
      userAction: {
        name: action.name,
        sourceComponentId: component.id,
        surfaceId: surfaceId ?? '',
        timestamp: new Date().toISOString(),
        context,
      },
    };

    return processor.dispatch(message);
  }, [action, component, surfaceId, processor]);
}

/**
 * Hook to set data at a path in the data model.
 */
export function useSetData(
  component: Types.AnyComponentNode,
  surfaceId: string | null
) {
  const { processor } = useA2UIContext();

  return useCallback(
    (path: string, value: Types.DataValue) => {
      processor.setData(component, path, value, surfaceId);
    },
    [component, surfaceId, processor]
  );
}

/**
 * Unified hook for A2UI message handling.
 * Provides convenient access to processor and surfaces.
 */
export function useA2UI() {
  const { processor, surfaces } = useA2UIContext();

  return useMemo(
    () => ({
      processor,
      surfaces,
      dispatch: processor.dispatch.bind(processor),
      processMessages: processor.processMessages.bind(processor),
      getSurface: (id: string) => surfaces.get(id) ?? null,
      clearSurfaces: processor.clearSurfaces.bind(processor),
    }),
    [processor, surfaces]
  );
}
