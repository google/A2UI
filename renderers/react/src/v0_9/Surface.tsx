import React from 'react';
import { useA2UI } from './core/A2UIProvider.js';
import { ComponentHost } from './core/ComponentHost.js';

interface SurfaceProps {
  /** The ID of the surface to render. */
  surfaceId: string;
}

/**
 * Renders a single A2UI surface by ID.
 *
 * Must be used within an `<A2UIProvider>`.
 *
 * @example
 * ```tsx
 * <A2UIProvider catalog={catalog} registry={registry} onAction={handleAction}>
 *   <Surface surfaceId="main" />
 * </A2UIProvider>
 * ```
 */
export function Surface({ surfaceId }: SurfaceProps) {
  const { surfaceGroup, registry } = useA2UI();
  const surface = surfaceGroup.getSurface(surfaceId);

  if (!surface) return null;

  return (
    <div className="a2ui-surface" data-surface-id={surfaceId}>
      <ComponentHost
        surface={surface}
        componentId="root"
        dataContextPath="/"
        registry={registry}
      />
    </div>
  );
}
