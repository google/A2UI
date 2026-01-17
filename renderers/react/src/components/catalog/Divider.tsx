import { Divider as SemiDivider } from '@douyinfe/semi-ui';
import { Types } from '@a2ui/lit/0.8';
import { CatalogComponentProps } from './index';

export function Divider({ component }: CatalogComponentProps) {
  const node = component as Types.DividerNode;
  const { axis = 'horizontal', color, thickness } = node.properties;

  const style: React.CSSProperties = {
    flex: component.weight ?? 'initial',
    ...(color && { borderColor: color }),
    ...(thickness && { borderWidth: thickness }),
  };

  return (
    <SemiDivider
      data-id={component.id}
      layout={axis === 'vertical' ? 'vertical' : 'horizontal'}
      style={style}
    />
  );
}

