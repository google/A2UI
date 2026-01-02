/**
 * A2UI Card Component
 * Elevated surface container with rounded corners and shadow
 */

import { useA2UI } from '../../context';
import { registerComponent, renderChild, type A2UIComponentFn } from '../../renderer';
import type { A2UIComponentSpec } from '../../types';

export const Card: A2UIComponentFn = ({ spec }) => {
  const { theme } = useA2UI();

  // Support both spec-based child and pre-rendered child (from adjacency-list format)
  const preRendered = spec.renderedChild as React.ReactNode | undefined;
  const childContent = preRendered || renderChild(spec.child as A2UIComponentSpec);

  return (
    <div
      style={{
        background: theme.colors.surface,
        borderRadius: theme.borderRadius,
        padding: theme.spacing(2),
        boxShadow: '0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)',
      }}
    >
      {childContent}
    </div>
  );
};

registerComponent('Card', Card);
