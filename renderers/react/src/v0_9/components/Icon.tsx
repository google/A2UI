import React, { memo } from 'react';
import type { A2UIComponentProps } from '../core/types.js';

/**
 * Icon component — displays an icon by name.
 */
export const Icon = memo(function Icon({
  props,
}: A2UIComponentProps) {
  const name = props.name?.value ?? '';

  return (
    <span className="a2ui-icon">{name}</span>
  );
});
