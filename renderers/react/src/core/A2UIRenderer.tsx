import { Suspense, useMemo, memo, type ReactNode } from 'react';
import { useA2UI } from '../hooks/useA2UI';
import { ComponentNode } from './ComponentNode';
import { type ComponentRegistry } from '../registry/ComponentRegistry';
import { cn } from '../lib/utils';

/** Default loading fallback - memoized to prevent recreation */
const DefaultLoadingFallback = memo(function DefaultLoadingFallback() {
  return (
    <div className="a2ui-loading" style={{ padding: '16px', opacity: 0.5 }}>
      Loading...
    </div>
  );
});

export interface A2UIRendererProps {
  /** The surface ID to render */
  surfaceId: string;
  /** Additional CSS classes for the surface container */
  className?: string;
  /** Fallback content when surface is not yet available */
  fallback?: ReactNode;
  /** Loading fallback for lazy-loaded components */
  loadingFallback?: ReactNode;
  /** Optional custom component registry */
  registry?: ComponentRegistry;
}

/**
 * A2UIRenderer - renders an A2UI surface.
 *
 * This is the main entry point for rendering A2UI content in your React app.
 * It reads the surface state from the A2UI store and renders the component tree.
 *
 * Memoized to prevent unnecessary re-renders when props haven't changed.
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <A2UIProvider onAction={handleAction}>
 *       <A2UIRenderer surfaceId="main" />
 *     </A2UIProvider>
 *   );
 * }
 * ```
 */
export const A2UIRenderer = memo(function A2UIRenderer({
  surfaceId,
  className,
  fallback = null,
  loadingFallback,
  registry,
}: A2UIRendererProps) {
  const { getSurface, version } = useA2UI();

  // Get surface - this will re-render when version changes
  const surface = getSurface(surfaceId);

  // Memoize surface styles to prevent object recreation
  const surfaceStyles = useMemo<React.CSSProperties>(() => {
    if (!surface?.styles) return {};

    const styles: React.CSSProperties & Record<string, string> = {};
    // Convert surface styles to CSS custom properties
    for (const [key, value] of Object.entries(surface.styles)) {
      // Convert camelCase to kebab-case for CSS custom properties
      const cssVar = `--a2ui-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      styles[cssVar] = String(value);
    }
    return styles;
  }, [surface?.styles]);

  // No surface yet
  if (!surface || !surface.componentTree) {
    return <>{fallback}</>;
  }

  // Use provided fallback or default memoized component
  const actualLoadingFallback = loadingFallback ?? <DefaultLoadingFallback />;

  return (
    <div
      className={cn('a2ui-surface', className)}
      style={surfaceStyles}
      data-surface-id={surfaceId}
      data-version={version}
    >
      <Suspense fallback={actualLoadingFallback}>
        <ComponentNode
          node={surface.componentTree}
          surfaceId={surfaceId}
          registry={registry}
        />
      </Suspense>
    </div>
  );
});

export default A2UIRenderer;
