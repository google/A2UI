import { Card as SemiCard } from '@douyinfe/semi-ui';
import { Types } from '@a2ui/lit/0.8';
import { CatalogComponentProps } from './index';
import { ChildRenderer } from '../Renderer';

export function Card({ surfaceId, component }: CatalogComponentProps) {
  const node = component as Types.CardNode;
  const { children, child } = node.properties;

  const childComponents = children ?? (child ? [child] : null);

  const style: React.CSSProperties = {
    flex: component.weight ?? 'initial',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(var(--semi-grey-1), 0.1)',
    overflow: 'hidden',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  };

  const bodyStyle: React.CSSProperties = {
    padding: '16px',
  };

  return (
    <SemiCard
      data-id={component.id}
      style={style}
      bodyStyle={bodyStyle}
      className="a2ui-card"
    >
      <ChildRenderer surfaceId={surfaceId} children={childComponents} />
    </SemiCard>
  );
}
