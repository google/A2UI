import { Types } from '@a2ui/lit/0.8';
import { CatalogComponentProps } from './index';
import { ChildRenderer } from '../Renderer';

export function Row({ surfaceId, component }: CatalogComponentProps) {
  const node = component as Types.RowNode;
  const { alignment = 'stretch', distribution = 'start', children } = node.properties;

  const alignItems = alignment === 'stretch' ? 'stretch' :
    alignment === 'start' ? 'flex-start' :
    alignment === 'end' ? 'flex-end' : 'center';

  const justifyContent = distribution === 'start' ? 'flex-start' :
    distribution === 'end' ? 'flex-end' :
    distribution === 'center' ? 'center' :
    distribution === 'spaceAround' ? 'space-around' :
    distribution === 'spaceBetween' ? 'space-between' :
    distribution === 'spaceEvenly' ? 'space-evenly' : 'flex-start';

  const style: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    alignItems,
    justifyContent,
    gap: '16px',
    flex: component.weight ?? 'initial',
  };

  return (
    <div data-id={component.id} style={style}>
      <ChildRenderer surfaceId={surfaceId} children={children} />
    </div>
  );
}
