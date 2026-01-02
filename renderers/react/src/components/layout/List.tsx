/**
 * A2UI List Component
 * Renders a list of items, optionally from a data source with templates
 */

import { useA2UI, resolvePath, instantiateTemplate } from '../../context';
import { registerComponent, renderChildren, A2UIRenderer, type A2UIComponentFn } from '../../renderer';
import { alignmentMap } from '../helpers';
import type { A2UIComponentSpec } from '../../types';

export const List: A2UIComponentFn = ({ spec }) => {
  const { theme, data } = useA2UI();
  const dir = spec.direction as string | undefined;
  const align = spec.alignment as string | undefined;
  const isHoriz = dir === 'horizontal';
  const items = spec.items ? (resolvePath(spec.items as unknown[], data) as unknown[]) : null;
  const itemTemplate = spec.itemTemplate as A2UIComponentSpec | undefined;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isHoriz ? 'row' : 'column',
        gap: theme.spacing(1),
        alignItems: align ? alignmentMap[align] : 'stretch',
        overflow: 'auto',
      }}
    >
      {items && itemTemplate
        ? items.map((item, i) => (
            <div key={(item as { id?: string })?.id || i}>
              <A2UIRenderer spec={instantiateTemplate(itemTemplate, item, i)} />
            </div>
          ))
        : renderChildren(spec.children as A2UIComponentSpec[])}
    </div>
  );
};

registerComponent('List', List);
