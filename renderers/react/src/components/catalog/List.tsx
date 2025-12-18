import React from 'react';
import { Types } from '@a2ui/lit/0.8';
import { CatalogComponentProps } from './index';
import { ChildRenderer } from '../Renderer';

export function List({ surfaceId, component }: CatalogComponentProps) {
  const node = component as Types.ListNode;
  const { direction = 'vertical', children } = node.properties;

  const style: React.CSSProperties = {
    display: 'flex',
    flexDirection: direction === 'horizontal' ? 'row' : 'column',
    gap: '8px',
    overflow: 'auto',
    flex: component.weight ?? 'initial',
  };

  return (
    <div id={component.id} style={style}>
      <ChildRenderer surfaceId={surfaceId} children={children} />
    </div>
  );
}

