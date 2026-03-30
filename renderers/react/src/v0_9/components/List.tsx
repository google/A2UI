import React, { memo } from 'react';
import type { A2UIComponentProps } from '../core/types.js';
import { ComponentHost } from '../core/ComponentHost.js';
import { getNormalizedPath } from '../core/useComponent.js';
import { useA2UI } from '../core/A2UIProvider.js';

/**
 * List component — arranges children with a configurable direction.
 */
export const List = memo(function List({
  props,
  surfaceId,
  dataContextPath,
  registry,
}: A2UIComponentProps) {
  const { surfaceGroup } = useA2UI();
  const surface = surfaceGroup.getSurface(surfaceId);

  const direction = props.direction?.value ?? 'vertical';
  const align = props.align?.value ?? 'stretch';
  const childrenRaw = props.children?.raw;
  const childrenValue = props.children?.value;

  if (!surface) return null;

  const alignMap: Record<string, string> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch',
  };

  const style: React.CSSProperties = {
    display: 'flex',
    flexDirection: direction === 'horizontal' ? 'row' : 'column',
    alignItems: alignMap[align] ?? 'stretch',
  };

  // Repeating template: { componentId, path }
  if (childrenRaw && typeof childrenRaw === 'object' && 'componentId' in childrenRaw) {
    const items = Array.isArray(childrenValue) ? childrenValue : [];
    return (
      <div className="a2ui-list" style={style}>
        {items.map((_: any, index: number) => (
          <ComponentHost
            key={index}
            surface={surface}
            componentId={childrenRaw.componentId}
            dataContextPath={getNormalizedPath(childrenRaw.path, dataContextPath, index)}
            registry={registry}
          />
        ))}
      </div>
    );
  }

  // Static array of component IDs
  const childIds = Array.isArray(childrenRaw) ? childrenRaw : [];
  return (
    <div className="a2ui-list" style={style}>
      {childIds.map((childId: string) => (
        <ComponentHost
          key={childId}
          surface={surface}
          componentId={childId}
          dataContextPath={dataContextPath}
          registry={registry}
        />
      ))}
    </div>
  );
});
