import React, { memo } from 'react';
import type { A2UIComponentProps } from '../core/types.js';

/**
 * Divider component — renders a horizontal or vertical divider.
 */
export const Divider = memo(function Divider({
  props,
}: A2UIComponentProps) {
  const axis = props.axis?.value ?? 'horizontal';

  return (
    <hr className={`a2ui-divider a2ui-divider--${axis}`} />
  );
});
