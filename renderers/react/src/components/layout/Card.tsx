import { memo } from 'react';
import type { Types } from '@a2ui/lit/0.8';
import type { A2UIComponentProps } from '../../types';
import { useA2UIComponent } from '../../hooks/useA2UIComponent';
import { classMapToString, stylesToObject } from '../../lib/utils';
import { ComponentNode } from '../../core/ComponentNode';

/**
 * Card component - a container that visually groups content.
 *
 * Renders either a single child or multiple children.
 */
export const Card = memo(function Card({ node, surfaceId }: A2UIComponentProps<Types.CardNode>) {
  const { theme } = useA2UIComponent(node, surfaceId);
  const props = node.properties;

  // Card can have either a single child or multiple children
  const rawChildren = props.children ?? (props.child ? [props.child] : []);
  const children = Array.isArray(rawChildren) ? rawChildren : [];

  // Match Lit's section styles: height/width 100%, min-height 0, overflow auto
  const cardStyle: React.CSSProperties = {
    height: '100%',
    width: '100%',
    minHeight: 0,
    overflow: 'auto',
    ...stylesToObject(theme.additionalStyles?.Card),
  };

  return (
    <section
      className={`a2ui-card ${classMapToString(theme.components.Card)}`}
      style={cardStyle}
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

export default Card;
