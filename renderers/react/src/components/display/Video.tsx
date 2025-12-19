/**
 * A2UI Video Component
 * Renders video with native HTML5 controls
 */

import { useResolve } from '../../context';
import { registerComponent, type A2UIComponentFn } from '../../renderer';

export const Video: A2UIComponentFn = ({ spec }) => {
  const url = useResolve(spec.url as string);

  return (
    <video
      src={url}
      controls
      style={{ width: '100%', maxWidth: 640, borderRadius: 8 }}
    />
  );
};

registerComponent('Video', Video);
