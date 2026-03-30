import React, { memo } from 'react';
import type { SurfaceModel, ComponentApi } from '@a2ui/web_core/v0_9';
import type { ComponentRegistry } from './types.js';
import { useComponentProps } from './useComponent.js';

interface ComponentHostProps {
  /** The SurfaceModel containing component and data state. */
  surface: SurfaceModel<ComponentApi>;
  /** The component ID to render (defaults to 'root'). */
  componentId?: string;
  /** The data context path scope (defaults to '/'). */
  dataContextPath?: string;
  /** The component registry mapping type names to React components. */
  registry: ComponentRegistry;
}

/**
 * Dynamically renders an A2UI component by looking up its type in the registry.
 *
 * This is the bridge between the A2UI protocol and React components.
 */
export const ComponentHost = memo(function ComponentHost({
  surface,
  componentId = 'root',
  dataContextPath = '/',
  registry,
}: ComponentHostProps) {
  const componentModel = surface.componentsModel.get(componentId);
  if (!componentModel) return null;

  const Component = registry.get(componentModel.type);
  if (!Component) {
    return <div data-a2ui-unknown={componentModel.type}>Unknown component: {componentModel.type}</div>;
  }

  const boundProps = useComponentProps(surface, componentId, dataContextPath);

  return (
    <Component
      props={boundProps}
      surfaceId={surface.id}
      componentId={componentId}
      dataContextPath={dataContextPath}
      registry={registry}
    />
  );
});
