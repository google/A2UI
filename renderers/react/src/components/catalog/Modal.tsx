import React, { useState } from 'react';
import { Modal as SemiModal } from '@douyinfe/semi-ui';
import { Types } from '@a2ui/lit/0.8';
import { CatalogComponentProps } from './index';
import { Renderer } from '../Renderer';

export function Modal({ surfaceId, component }: CatalogComponentProps) {
  const node = component as Types.ModalNode;
  const { entryPointChild, contentChild } = node.properties;
  const [visible, setVisible] = useState(false);

  const style: React.CSSProperties = {
    flex: component.weight ?? 'initial',
  };

  return (
    <div id={component.id} style={style}>
      {entryPointChild && (
        <div onClick={() => setVisible(true)}>
          <Renderer surfaceId={surfaceId} component={entryPointChild as Types.AnyComponentNode} />
        </div>
      )}
      <SemiModal
        visible={visible}
        onCancel={() => setVisible(false)}
        footer={null}
      >
        {contentChild && (
          <Renderer surfaceId={surfaceId} component={contentChild as Types.AnyComponentNode} />
        )}
      </SemiModal>
    </div>
  );
}

