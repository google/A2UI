import { memo } from 'react';
import type { Types } from '@a2ui/lit/0.8';
import type { A2UIComponentProps } from '../../types';
import { useA2UIComponent } from '../../hooks/useA2UIComponent';
import { classMapToString, stylesToObject } from '../../lib/utils';
import { ComponentNode } from '../../core/ComponentNode';

type Direction = 'vertical' | 'horizontal';
type Alignment = 'start' | 'center' | 'end' | 'stretch';

const alignmentMap: Record<Alignment, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
};

/**
 * List component - renders a scrollable list of items.
 *
 * Supports direction (vertical/horizontal) and alignment properties.
 */
export const List = memo(function List({ node, surfaceId }: A2UIComponentProps<Types.ListNode>) {
  const { theme } = useA2UIComponent(node, surfaceId);
  const props = node.properties;

  const direction = (props.direction as Direction) ?? 'vertical';
  const alignment = props.alignment as Alignment | undefined;

  // Match Lit renderer styles exactly:
  // - Vertical: display: grid
  // - Horizontal: display: flex with horizontal scroll
  const style: React.CSSProperties = direction === 'horizontal'
    ? {
        display: 'flex',
        maxWidth: '100%',
        overflowX: 'scroll',
        overflowY: 'hidden',
        scrollbarWidth: 'none',
        ...(alignment && { alignItems: alignmentMap[alignment] }),
        ...stylesToObject(theme.additionalStyles?.List),
      }
    : {
        display: 'grid',
        ...(alignment && { alignItems: alignmentMap[alignment] }),
        ...stylesToObject(theme.additionalStyles?.List),
      };

  const children = Array.isArray(props.children) ? props.children : [];

  return (
    <section
      className={classMapToString(theme.components.List)}
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

export default List;
