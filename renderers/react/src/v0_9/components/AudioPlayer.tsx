import React, { memo } from 'react';
import type { A2UIComponentProps } from '../core/types.js';

/**
 * AudioPlayer component — renders an audio element with optional description.
 */
export const AudioPlayer = memo(function AudioPlayer({
  props,
}: A2UIComponentProps) {
  const url = props.url?.value ?? '';
  const description = props.description?.value ?? '';

  return (
    <div className="a2ui-audio-player">
      {description && <span className="a2ui-audio-player__description">{description}</span>}
      <audio src={url} controls />
    </div>
  );
});
