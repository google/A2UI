import { useCallback } from 'react';
import { Button as SemiButton } from '@douyinfe/semi-ui';
import { Types } from '@a2ui/lit/0.8';
import { CatalogComponentProps } from './index';
import { useAction } from '../../core/hooks';
import { ChildRenderer } from '../Renderer';

export function Button({ surfaceId, component }: CatalogComponentProps) {
  const node = component as Types.ButtonNode;
  const { action, child } = node.properties;

  const handleAction = useAction(action, component, surfaceId);

  const handleClick = useCallback(() => {
    handleAction();
  }, [handleAction]);

  const style: React.CSSProperties = {
    flex: component.weight ?? 'initial',
  };

  const childComponents = child ? [child] : null;

  return (
    <SemiButton
      data-id={component.id}
      theme="light"
      onClick={handleClick}
      style={style}
    >
      <ChildRenderer surfaceId={surfaceId} children={childComponents} />
    </SemiButton>
  );
}
