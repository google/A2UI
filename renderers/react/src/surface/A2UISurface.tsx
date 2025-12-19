/**
 * A2UISurface Component
 * Renders a surface from the MessageProcessor's adjacency-list format
 */

import type { ReactElement, CSSProperties } from 'react';
import { useMemo, useCallback, createContext, useContext } from 'react';
import { MessageProcessor, getDefaultProcessor } from '../processor';
import type { StoredComponent, SurfaceState, A2UIClientAction } from '../processor/types';
import { useSurface } from './hooks';
import { resolveValue } from '../binding/resolver';
import { getComponent } from '../renderer';
import { A2UIProvider, useA2UI, themeToCSSVars } from '../context';
import type { A2UITheme, A2UIAction } from '../types';

// =============================================================================
// SURFACE CONTEXT
// =============================================================================

interface SurfaceContextValue {
  surfaceId: string;
  surface: SurfaceState;
  processor: MessageProcessor;
  getComponent: (id: string) => StoredComponent | undefined;
  resolveValue: <T>(value: unknown) => T;
  dispatchAction: (componentId: string, actionName: string, context?: Record<string, unknown>) => void;
}

const SurfaceContext = createContext<SurfaceContextValue | null>(null);

export function useSurfaceContext(): SurfaceContextValue {
  const ctx = useContext(SurfaceContext);
  if (!ctx) throw new Error('useSurfaceContext must be used within A2UISurface');
  return ctx;
}

// =============================================================================
// COMPONENT NODE RENDERER
// =============================================================================

interface ComponentNodeProps {
  componentId: string;
}

/**
 * Renders a single component node from the adjacency list
 */
function ComponentNode({ componentId }: ComponentNodeProps): ReactElement | null {
  const { surface, resolveValue } = useSurfaceContext();
  const stored = surface.components.get(componentId);

  if (!stored) {
    console.warn(`[A2UI] Component not found: ${componentId}`);
    return null;
  }

  const Component = getComponent(stored.type);

  if (!Component) {
    return (
      <div style={{ color: '#d32f2f', background: '#ffebee', padding: '4px 8px', borderRadius: 4, fontSize: 12 }}>
        Unknown: {stored.type}
      </div>
    );
  }

  // Resolve all prop values that might be data bindings
  const resolvedProps = resolveProps(stored.props, resolveValue);

  // Convert adjacency-list format to spec format for the existing components
  // Use explicit type to satisfy TypeScript strict mode
  const baseSpec = {
    id: stored.id,
    component: stored.type,
    ...resolvedProps,
    // Remove children/child - will be handled specially below
    children: undefined,
    child: undefined,
  };

  // Handle children prop (array of component IDs)
  const childIds = stored.props.children as string[] | undefined;
  if (Array.isArray(childIds) && childIds.length > 0) {
    const renderedChildren = childIds.map((childId) => (
      <ComponentNode key={childId} componentId={childId} />
    ));
    return <Component spec={{ ...baseSpec, renderedChildren }} />;
  }

  // Handle child prop (single component ID)
  const childId = stored.props.child as string | undefined;
  if (typeof childId === 'string') {
    const renderedChild = <ComponentNode componentId={childId} />;
    return <Component spec={{ ...baseSpec, renderedChild }} />;
  }

  return <Component spec={baseSpec} />;
}

/**
 * Resolve all path references in props
 */
function resolveProps(
  props: Record<string, unknown>,
  resolve: <T>(value: unknown) => T
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') {
      // Don't resolve children - they're component IDs
      resolved[key] = value;
    } else if (typeof value === 'object' && value !== null && 'path' in value) {
      // This is a path reference
      resolved[key] = resolve(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursively resolve nested objects
      resolved[key] = resolveProps(value as Record<string, unknown>, resolve);
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
}

// =============================================================================
// A2UI SURFACE COMPONENT
// =============================================================================

interface A2UISurfaceProps {
  /** The surface ID to render */
  surfaceId: string;
  /** Optional custom MessageProcessor instance */
  processor?: MessageProcessor;
  /** Handler for actions dispatched from components */
  onAction?: (action: A2UIClientAction) => void;
  /** Theme overrides */
  theme?: Partial<A2UITheme>;
  /** Light/dark mode */
  mode?: 'light' | 'dark';
  /** Additional CSS class */
  className?: string;
  /** Additional inline styles */
  style?: CSSProperties;
  /** Show loading state while surface is buffering */
  showLoading?: boolean;
  /** Custom loading component */
  loadingComponent?: ReactElement;
}

/**
 * A2UISurface renders a surface from the MessageProcessor
 * It reconstructs the component tree from the adjacency-list format
 */
export function A2UISurface({
  surfaceId,
  processor,
  onAction,
  theme: themeOverrides,
  mode = 'light',
  className,
  style,
  showLoading = true,
  loadingComponent,
}: A2UISurfaceProps): ReactElement | null {
  const proc = processor || getDefaultProcessor();
  const surface = useSurface(surfaceId, proc);

  // Create resolver bound to this surface's data model
  // NOTE: All hooks must be called unconditionally before any early returns
  const boundResolveValue = useCallback(
    <T,>(value: unknown): T => {
      if (!surface) return value as T;
      return resolveValue(value, surface.dataModel) as T;
    },
    [surface]
  );

  // Create action dispatcher
  const dispatchAction = useCallback(
    (componentId: string, actionName: string, context?: Record<string, unknown>) => {
      const action: A2UIClientAction = {
        surfaceId,
        componentId,
        action: { name: actionName, context },
      };
      onAction?.(action);
    },
    [surfaceId, onAction]
  );

  // Get component helper
  const getComponentById = useCallback(
    (id: string) => surface?.components.get(id),
    [surface]
  );

  // Bridge to the A2UI action system for nested components
  const handleAction = useCallback(
    (action: A2UIAction) => {
      onAction?.({
        surfaceId,
        componentId: action.componentId,
        action: {
          name: action.name || action.action || 'unknown',
          context: action.context,
        },
      });
    },
    [surfaceId, onAction]
  );

  // Convert data model Map to object for provider
  const dataObject = useMemo(() => {
    if (!surface) return {};
    return Object.fromEntries(surface.dataModel);
  }, [surface]);

  // Context value
  const contextValue = useMemo<SurfaceContextValue | null>(
    () =>
      surface
        ? {
            surfaceId,
            surface,
            processor: proc,
            getComponent: getComponentById,
            resolveValue: boundResolveValue,
            dispatchAction,
          }
        : null,
    [surfaceId, surface, proc, getComponentById, boundResolveValue, dispatchAction]
  );

  // Handle deleted state - check first since deleted surfaces may be removed from Map
  if (!surface || surface.status === 'deleted') {
    return null;
  }

  // Handle buffering state (waiting for beginRendering)
  if (surface.status === 'buffering') {
    if (!showLoading) return null;
    return (
      loadingComponent || (
        <div className="a2ui-surface-loading" style={{ padding: 16, textAlign: 'center', color: '#666' }}>
          Loading surface...
        </div>
      )
    );
  }

  // No root component yet
  if (!surface.rootId) {
    return null;
  }

  return (
    <SurfaceContext.Provider value={contextValue!}>
      <A2UIProvider data={dataObject} theme={themeOverrides} mode={mode} onAction={handleAction}>
        <SurfaceInner
          surface={surface}
          className={className}
          style={style}
        />
      </A2UIProvider>
    </SurfaceContext.Provider>
  );
}

/**
 * Inner component that has access to A2UI context
 */
function SurfaceInner({
  surface,
  className,
  style,
}: {
  surface: SurfaceState;
  className?: string;
  style?: CSSProperties;
}): ReactElement {
  const { theme } = useA2UI();
  const cssVars = themeToCSSVars(theme);

  return (
    <div
      className={`a2ui-surface ${className || ''}`}
      data-surface-id={surface.surfaceId}
      style={{
        ...cssVars,
        fontFamily: theme.font,
        color: theme.colors.text,
        backgroundColor: theme.colors.background,
        ...style,
      }}
    >
      {surface.rootId && <ComponentNode componentId={surface.rootId} />}
    </div>
  );
}

// =============================================================================
// MULTI-SURFACE CONTAINER
// =============================================================================

interface A2UIMultiSurfaceProps {
  /** Optional custom MessageProcessor instance */
  processor?: MessageProcessor;
  /** Handler for actions dispatched from any surface */
  onAction?: (action: A2UIClientAction) => void;
  /** Props passed to each surface */
  surfaceProps?: Omit<A2UISurfaceProps, 'surfaceId' | 'processor' | 'onAction'>;
  /** Layout direction */
  direction?: 'row' | 'column';
  /** Gap between surfaces */
  gap?: number;
  /** Additional CSS class */
  className?: string;
  /** Additional inline styles */
  style?: CSSProperties;
}

/**
 * Renders all surfaces from the MessageProcessor
 */
export function A2UIMultiSurface({
  processor,
  onAction,
  surfaceProps,
  direction = 'column',
  gap = 16,
  className,
  style,
}: A2UIMultiSurfaceProps): ReactElement {
  const proc = processor || getDefaultProcessor();

  // Subscribe to surface list
  const surfaceIds = useSurfaceIds(proc);

  return (
    <div
      className={`a2ui-multi-surface ${className || ''}`}
      style={{
        display: 'flex',
        flexDirection: direction,
        gap,
        ...style,
      }}
    >
      {surfaceIds.map((surfaceId) => (
        <A2UISurface
          key={surfaceId}
          surfaceId={surfaceId}
          processor={proc}
          onAction={onAction}
          {...surfaceProps}
        />
      ))}
    </div>
  );
}

// Import for internal use
import { useSurfaceIds } from './hooks';
