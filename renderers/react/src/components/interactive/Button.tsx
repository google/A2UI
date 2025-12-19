/**
 * A2UI Button Component
 * Interactive button that dispatches actions
 */

import { useA2UI } from '../../context';
import { registerComponent, renderChild, type A2UIComponentFn } from '../../renderer';
import type { A2UIComponentSpec, A2UIAction } from '../../types';

export const Button: A2UIComponentFn = ({ spec }) => {
  const { dispatch, theme } = useA2UI();
  const isPrimary = spec.primary !== false;
  const action = spec.action as A2UIAction;

  // Support both spec-based child and pre-rendered child (from adjacency-list format)
  const preRendered = spec.renderedChild as React.ReactNode | undefined;
  const childContent = preRendered || renderChild(spec.child as A2UIComponentSpec);

  return (
    <button
      onClick={() => action && dispatch(action)}
      style={{
        padding: `${theme.spacing(1)}px ${theme.spacing(2.5)}px`,
        borderRadius: theme.borderRadius,
        border: isPrimary ? 'none' : `1px solid ${theme.colors.primary}`,
        background: isPrimary ? theme.colors.primary : 'transparent',
        color: isPrimary ? '#fff' : theme.colors.primary,
        cursor: 'pointer',
        ...theme.typography.body,
        fontWeight: 500,
      }}
    >
      {childContent}
    </button>
  );
};

registerComponent('Button', Button);
