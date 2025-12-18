import { Types } from '@a2ui/lit/0.8';
import { getCatalogComponent } from './catalog';

export interface RendererProps {
  surfaceId: string;
  component: Types.AnyComponentNode;
}

/**
 * Recursive renderer component that renders an A2UI component tree.
 */
export function Renderer({ surfaceId, component }: RendererProps) {
  const CatalogComponent = getCatalogComponent(component.type);

  if (!CatalogComponent) {
    console.warn(`Unknown component type: ${component.type}`);
    return null;
  }

  return (
    <CatalogComponent
      surfaceId={surfaceId}
      component={component}
    />
  );
}

export interface ChildRendererProps {
  surfaceId: string;
  children: Types.AnyComponentNode[] | null | undefined;
}

/**
 * Helper component to render an array of child components.
 */
export function ChildRenderer({ surfaceId, children }: ChildRendererProps) {
  if (!children || !Array.isArray(children)) {
    return null;
  }

  return (
    <>
      {children.map((child) => (
        <Renderer
          key={child.id}
          surfaceId={surfaceId}
          component={child}
        />
      ))}
    </>
  );
}

