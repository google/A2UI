import React from 'react';
import { VideoPlayer } from '@douyinfe/semi-ui';
import { Types } from '@a2ui/lit/0.8';
import { CatalogComponentProps } from './index';
import { useStringBinding } from '../../core/hooks';

export function Video({ surfaceId, component }: CatalogComponentProps) {
  const node = component as Types.VideoNode;
  const { url } = node.properties;

  const videoUrl = useStringBinding(url, component, surfaceId);

  if (!videoUrl) {
    return null;
  }

  const style: React.CSSProperties = {
    width: '100%',
    maxWidth: '100%',
    flex: component.weight ?? 'initial',
  };

  return (
    <div data-id={component.id} style={style}>
      <VideoPlayer
        src={videoUrl}
        theme="light"
        controlsList={['play', 'time', 'volume', 'playbackRate', 'fullscreen', 'pictureInPicture']}
      />
    </div>
  );
}

