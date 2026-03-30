import React, { memo } from 'react';
import type { A2UIComponentProps } from '../core/types.js';

/**
 * Text component — renders text content with an optional variant style.
 */
export const Text = memo(function Text({
  props,
}: A2UIComponentProps) {
  const text = props.text?.value ?? '';
  const variant = props.variant?.value ?? 'body';

  return (
    <span className={`a2ui-text a2ui-text--${variant}`}>
      {text}
    </span>
  );
});
