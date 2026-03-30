import React, { memo } from 'react';
import type { A2UIComponentProps } from '../core/types.js';

/**
 * Image component — renders an img element with url, fit, and variant.
 */
export const Image = memo(function Image({
  props,
}: A2UIComponentProps) {
  const url = props.url?.value ?? '';
  const fit = props.fit?.value ?? 'fill';
  const variant = props.variant?.value ?? 'mediumFeature';

  const fitMap: Record<string, string> = {
    contain: 'contain',
    cover: 'cover',
    fill: 'fill',
    none: 'none',
    scaleDown: 'scale-down',
  };

  return (
    <img
      className={`a2ui-image a2ui-image--${variant}`}
      src={url}
      alt=""
      style={{ objectFit: (fitMap[fit] ?? 'fill') as React.CSSProperties['objectFit'] }}
    />
  );
});
