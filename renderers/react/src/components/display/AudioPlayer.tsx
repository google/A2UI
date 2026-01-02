/**
 * A2UI AudioPlayer Component
 * Renders audio player with optional description
 */

import { useA2UI, useResolve } from '../../context';
import { registerComponent, type A2UIComponentFn } from '../../renderer';

export const AudioPlayer: A2UIComponentFn = ({ spec }) => {
  const { theme } = useA2UI();
  const url = useResolve(spec.url as string);
  const desc = spec.description ? useResolve(spec.description as string) : null;

  return (
    <div
      style={{
        padding: theme.spacing(1),
        background: theme.colors.surface,
        borderRadius: theme.borderRadius,
      }}
    >
      {desc && (
        <div style={{ ...theme.typography.caption, marginBottom: 4 }}>{desc}</div>
      )}
      <audio src={url} controls style={{ width: '100%' }} />
    </div>
  );
};

registerComponent('AudioPlayer', AudioPlayer);
