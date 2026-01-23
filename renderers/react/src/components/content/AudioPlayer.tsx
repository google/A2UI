import { memo } from 'react';
import type { Types } from '@a2ui/lit/0.8';
import type { A2UIComponentProps } from '../../types';
import { useA2UIComponent } from '../../hooks/useA2UIComponent';
import { classMapToString, stylesToObject } from '../../lib/utils';

/**
 * AudioPlayer component - renders an audio player with optional description.
 */
export const AudioPlayer = memo(function AudioPlayer({ node, surfaceId }: A2UIComponentProps<Types.AudioPlayerNode>) {
  const { theme, resolveString } = useA2UIComponent(node, surfaceId);
  const props = node.properties;

  const url = resolveString(props.url);
  const description = resolveString(props.description ?? null);

  if (!url) {
    return null;
  }

  return (
    <div
      className={classMapToString(theme.components.AudioPlayer)}
      style={stylesToObject(theme.additionalStyles?.AudioPlayer)}
    >
      {description && <p className="a2ui-audio-player__description">{description}</p>}
      <audio src={url} controls style={{ width: '100%' }} />
    </div>
  );
});

export default AudioPlayer;
