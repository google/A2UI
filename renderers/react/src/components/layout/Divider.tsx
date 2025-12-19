/**
 * A2UI Divider Component
 * Visual separator line (horizontal or vertical)
 */

import { useA2UI } from '../../context';
import { registerComponent, type A2UIComponentFn } from '../../renderer';

export const Divider: A2UIComponentFn = ({ spec }) => {
  const { theme } = useA2UI();
  const isVert = spec.axis === 'vertical';

  return (
    <div
      style={{
        background: theme.colors.textSecondary,
        opacity: 0.2,
        ...(isVert
          ? { width: 1, alignSelf: 'stretch', minHeight: 20 }
          : { height: 1, width: '100%' }),
      }}
    />
  );
};

registerComponent('Divider', Divider);
