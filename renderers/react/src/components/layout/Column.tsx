/**
 * A2UI Column Component
 * Vertical flex layout container with weight support
 */

import { Children, cloneElement, isValidElement, type ReactElement } from 'react';
import { useA2UI } from '../../context';
import { registerComponent, renderChildren, type A2UIComponentFn } from '../../renderer';
import { distributionMap, alignmentMap } from '../helpers';
import type { A2UIComponentSpec } from '../../types';

export const Column: A2UIComponentFn = ({ spec }) => {
  const { theme } = useA2UI();
  const dist = spec.distribution as string | undefined;
  const align = spec.alignment as string | undefined;
  const children = spec.children as A2UIComponentSpec[] | undefined;

  // Support both spec-based children and pre-rendered children (from adjacency-list format)
  const preRendered = spec.renderedChildren as React.ReactNode | undefined;
  const renderedChildren = preRendered || renderChildren(children);

  // Apply weights to children
  const weightedChildren = renderedChildren
    ? Children.map(renderedChildren, (child, index) => {
        if (!isValidElement(child)) return child;
        const childSpec = children?.[index];
        const weight = childSpec?.weight as number | undefined;

        return cloneElement(child as ReactElement<{ style?: React.CSSProperties }>, {
          style: {
            ...(child.props as { style?: React.CSSProperties }).style,
            flex: weight !== undefined ? weight : undefined,
          },
        });
      })
    : null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(1),
        justifyContent: dist ? distributionMap[dist] : 'flex-start',
        alignItems: align ? alignmentMap[align] : 'stretch',
      }}
    >
      {weightedChildren}
    </div>
  );
};

registerComponent('Column', Column);
