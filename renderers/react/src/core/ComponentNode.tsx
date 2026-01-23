import { Suspense, useMemo, memo } from 'react';
import type { Types } from '@a2ui/lit/0.8';
import { ComponentRegistry } from '../registry/ComponentRegistry';

/** Memoized loading fallback to avoid recreating on each render */
const LoadingFallback = memo(function LoadingFallback() {
  return (
    <div className="a2ui-loading" style={{ padding: '8px', opacity: 0.5 }}>
      Loading...
    </div>
  );
});

interface ComponentNodeProps {
  /** The component node to render (can be null/undefined for safety) */
  node: Types.AnyComponentNode | null | undefined;
  /** The surface ID this component belongs to */
  surfaceId: string;
  /** Optional custom registry. Falls back to singleton. */
  registry?: ComponentRegistry;
}

/**
 * ComponentNode - dynamically renders an A2UI component based on its type.
 *
 * Looks up the component in the registry and renders it with the appropriate props.
 * Supports lazy-loaded components via React.Suspense.
 *
 * Memoized to prevent unnecessary re-renders when parent updates but node hasn't changed.
 */
export const ComponentNode = memo(function ComponentNode({
  node,
  surfaceId,
  registry,
}: ComponentNodeProps) {
  // Handle null/undefined/invalid nodes gracefully
  if (!node || typeof node !== 'object' || !('type' in node)) {
    if (node) {
      console.warn('[A2UI] Invalid component node (not resolved?):', node);
    }
    return null;
  }

  const actualRegistry = registry ?? ComponentRegistry.getInstance();

  const Component = useMemo(
    () => actualRegistry.get(node.type),
    [actualRegistry, node.type]
  );

  // Memoize wrapper style to mimic Lit's :host { display: block; flex: var(--weight); }
  // Every component needs a block wrapper for proper containment in flex layouts
  const wrapperStyle = useMemo<React.CSSProperties>(() => {
    const weight = node.weight;
    return typeof weight === 'number'
      ? { display: 'block', flex: weight }
      : { display: 'block' };
  }, [node.weight]);

  if (!Component) {
    console.warn(`[A2UI] Unknown component type: ${node.type}`);
    return <UnknownComponent type={node.type} />;
  }

  // Always wrap component to mimic Lit's :host element behavior
  return (
    <div style={wrapperStyle}>
      <Suspense fallback={<LoadingFallback />}>
        <Component node={node} surfaceId={surfaceId} />
      </Suspense>
    </div>
  );
});

/** Memoized unknown component fallback */
const UnknownComponent = memo(function UnknownComponent({ type }: { type: string }) {
  return (
    <div
      className="a2ui-unknown-component"
      style={{
        padding: '8px',
        backgroundColor: '#fee',
        color: '#c00',
        borderRadius: '4px',
        fontSize: '12px',
      }}
    >
      Unknown component: {type}
    </div>
  );
});

export default ComponentNode;
