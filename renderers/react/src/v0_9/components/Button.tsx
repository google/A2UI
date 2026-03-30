import React, { memo, useCallback } from 'react';
import type { A2UIComponentProps } from '../core/types.js';
import { ComponentHost } from '../core/ComponentHost.js';
import { dispatchAction } from '../core/useComponent.js';
import { useA2UI } from '../core/A2UIProvider.js';

/**
 * Button component — dispatches an action on click, renders a child component.
 */
export const Button = memo(function Button({
  props,
  surfaceId,
  componentId,
  dataContextPath,
  registry,
}: A2UIComponentProps) {
  const { surfaceGroup } = useA2UI();
  const surface = surfaceGroup.getSurface(surfaceId);

  const childId = props.child?.raw;
  const variant = props.variant?.value ?? 'default';

  const handleClick = useCallback(() => {
    if (surface) {
      dispatchAction(surface, props.action?.raw, componentId, dataContextPath);
    }
  }, [surface, props.action?.raw, componentId, dataContextPath]);

  if (!surface) return null;

  return (
    <button
      className={`a2ui-button a2ui-button--${variant}`}
      onClick={handleClick}
    >
      {childId && (
        <ComponentHost
          surface={surface}
          componentId={childId}
          dataContextPath={dataContextPath}
          registry={registry}
        />
      )}
    </button>
  );
});
