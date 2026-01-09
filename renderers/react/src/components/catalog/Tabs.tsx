import { Tabs as SemiTabs, TabPane } from '@douyinfe/semi-ui';
import { Types } from '@a2ui/lit/0.8';
import { CatalogComponentProps } from './index';
import { Renderer } from '../Renderer';
import { useStringBinding } from '../../core/hooks';

interface TabItemProps {
  surfaceId: string;
  component: Types.AnyComponentNode;
  item: Types.TabsNode['properties']['tabItems'][0];
  index: number;
}

function TabItem({ surfaceId, component, item, index }: TabItemProps) {
  const title = useStringBinding(item.title, component, surfaceId);

  return (
    <TabPane tab={title ?? `Tab ${index + 1}`} itemKey={String(index)}>
      {item.child && (
        <Renderer surfaceId={surfaceId} component={item.child as Types.AnyComponentNode} />
      )}
    </TabPane>
  );
}

export function Tabs({ surfaceId, component }: CatalogComponentProps) {
  const node = component as Types.TabsNode;
  const { tabItems } = node.properties;

  const style: React.CSSProperties = {
    flex: component.weight ?? 'initial',
  };

  return (
    <div data-id={component.id}>
      <SemiTabs style={style}>
        {tabItems?.map((item, index) => (
          <TabItem
            key={index}
            surfaceId={surfaceId}
            component={component}
            item={item}
            index={index}
          />
        ))}
      </SemiTabs>
    </div>
  );
}

