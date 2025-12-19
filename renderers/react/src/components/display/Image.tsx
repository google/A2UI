/**
 * A2UI Image Component
 * Renders images with various sizing hints
 */

import type { CSSProperties } from 'react';
import { useResolve } from '../../context';
import { registerComponent, type A2UIComponentFn } from '../../renderer';

export const Image: A2UIComponentFn = ({ spec }) => {
  const url = useResolve(spec.url as string);
  const fit = (spec.fit as string) || 'contain';
  const hint = spec.usageHint as string | undefined;

  const sizeMap: Record<string, CSSProperties> = {
    icon: { width: 24, height: 24 },
    avatar: { width: 48, height: 48, borderRadius: '50%' },
    smallFeature: { width: 120 },
    mediumFeature: { width: 240 },
    largeFeature: { width: 400 },
    header: { width: '100%', height: 200 },
  };

  return (
    <img
      src={url}
      alt=""
      style={{ objectFit: fit as CSSProperties['objectFit'], ...sizeMap[hint || ''] }}
    />
  );
};

registerComponent('Image', Image);
