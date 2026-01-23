import { memo } from 'react';
import type { Types } from '@a2ui/lit/0.8';
import type { A2UIComponentProps } from '../../types';
import { useA2UIComponent } from '../../hooks/useA2UIComponent';
import { classMapToString, stylesToObject } from '../../lib/utils';
import { ComponentNode } from '../../core/ComponentNode';

type Distribution = 'start' | 'center' | 'end' | 'spaceBetween' | 'spaceAround' | 'spaceEvenly';
type Alignment = 'start' | 'center' | 'end' | 'stretch';

const distributionMap: Record<Distribution, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  spaceBetween: 'space-between',
  spaceAround: 'space-around',
  spaceEvenly: 'space-evenly',
};

const alignmentMap: Record<Alignment, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
};

/**
 * Column component - arranges children vertically using flexbox.
 *
 * Supports distribution (justify-content) and alignment (align-items) properties.
 */
export const Column = memo(function Column({ node, surfaceId }: A2UIComponentProps<Types.ColumnNode>) {
  const { theme } = useA2UIComponent(node, surfaceId);
  const props = node.properties;

  const distribution = props.distribution as Distribution | undefined;
  const alignment = props.alignment as Alignment | undefined;

  // Gap is controlled by theme classes (layout-g-*), not inline styles
  const style: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    minWidth: '100%',
    height: '100%',
    ...(distribution && { justifyContent: distributionMap[distribution] }),
    ...(alignment && { alignItems: alignmentMap[alignment] }),
    ...stylesToObject(theme.additionalStyles?.Column),
  };

  const children = Array.isArray(props.children) ? props.children : [];

  return (
    <section
      className={classMapToString(theme.components.Column)}
      style={style}
    >
      {children.map((child, index) => {
        const childId = typeof child === 'object' && child !== null && 'id' in child
          ? (child as Types.AnyComponentNode).id
          : `child-${index}`;
        const childNode = typeof child === 'object' && child !== null && 'type' in child
          ? (child as Types.AnyComponentNode)
          : null;
        return <ComponentNode key={childId} node={childNode} surfaceId={surfaceId} />;
      })}
    </section>
  );
});

export default Column;
