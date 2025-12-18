import React from 'react';
import { AudioPlayer } from '@douyinfe/semi-ui';
import { Types } from '@a2ui/lit/0.8';
import { CatalogComponentProps } from './index';
import { useStringBinding } from '../../core/hooks';

export function Audio({ surfaceId, component }: CatalogComponentProps) {
  const node = component as Types.AudioPlayerNode;
  const { url, description } = node.properties;

  const audioUrl = useStringBinding(url, component, surfaceId);
  const audioDescription = useStringBinding(description ?? null, component, surfaceId);

  if (!audioUrl) {
    return null;
  }

  const style: React.CSSProperties = {
    width: '100%',
    flex: component.weight ?? 'initial',
  };

  return (
    <div data-id={component.id} style={style}>
      {audioDescription && (
        <div style={{ marginBottom: 8, color: 'var(--semi-color-text-0)' }}>{audioDescription}</div>
      )}
      <AudioPlayer
        audioUrl={audioUrl}
        theme="light"
      />
    </div>
  );
}

