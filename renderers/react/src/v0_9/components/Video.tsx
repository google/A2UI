import React, { memo } from 'react';
import type { A2UIComponentProps } from '../core/types.js';

/**
 * Video component — renders a video element with controls.
 */
export const Video = memo(function Video({
  props,
}: A2UIComponentProps) {
  const url = props.url?.value ?? '';

  return (
    <video className="a2ui-video" src={url} controls />
  );
});
