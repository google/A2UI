import React, { memo } from 'react';
import type { A2UIComponentProps } from '../core/types.js';
import { ComponentHost } from '../core/ComponentHost.js';
import { useA2UI } from '../core/A2UIProvider.js';

/**
 * Card component — wraps a single child in a card container.
 */
export const Card = memo(function Card({
  props,
  surfaceId,
  dataContextPath,
  registry,
}: A2UIComponentProps) {
  const { surfaceGroup } = useA2UI();
  const surface = surfaceGroup.getSurface(surfaceId);
  const childId = props.child?.raw;

  if (!surface || !childId) return null;

  return (
    <div className="a2ui-card">
      <ComponentHost
        surface={surface}
        componentId={childId}
        dataContextPath={dataContextPath}
        registry={registry}
      />
    </div>
  );
});
