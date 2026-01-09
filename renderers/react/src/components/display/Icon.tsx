/**
 * A2UI Icon Component
 * Renders SVG icons from a predefined icon set
 */

import { useA2UI } from '../../context';
import { registerComponent, type A2UIComponentFn } from '../../renderer';
import { iconPaths } from '../helpers';

export const Icon: A2UIComponentFn = ({ spec }) => {
  const { theme } = useA2UI();
  const name = spec.name as string;
  const path = iconPaths[name] || iconPaths.star;

  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={theme.colors.text}>
      <path d={path} />
    </svg>
  );
};

registerComponent('Icon', Icon);
