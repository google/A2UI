/**
 * A2UI Divider Component
 *
 * Visual separator line.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { DividerComponent, BoundValue } from '../types/a2ui-types';
import { resolveValue, resolveStyleValues } from '../state/data-model-store';

export interface A2UIDividerProps {
  component: DividerComponent;
  dataModel: Record<string, unknown>;
}

export const A2UIDivider: React.FC<A2UIDividerProps> = ({
  component,
  dataModel,
}) => {
  // Resolve visibility
  const visible = component.visible !== undefined
    ? resolveValue(component.visible, dataModel)
    : true;

  if (!visible) {
    return null;
  }

  // Resolve orientation (default: horizontal)
  const orientation = component.orientation ?? 'horizontal';
  const isVertical = orientation === 'vertical';

  // Resolve thickness
  const thickness = component.thickness ?? 1;

  // Resolve color
  const color = component.color ?? '#e0e0e0';

  // Resolve custom styles
  const customStyle = resolveStyleValues(
    component.style as Record<string, BoundValue | string | number> | undefined,
    dataModel
  );

  return (
    <View
      style={[
        styles.divider,
        isVertical ? styles.vertical : styles.horizontal,
        isVertical
          ? { width: thickness, backgroundColor: color }
          : { height: thickness, backgroundColor: color },
        customStyle,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  divider: {
    backgroundColor: '#e0e0e0',
  },
  horizontal: {
    height: 1,
    width: '100%',
    marginVertical: 8,
  },
  vertical: {
    width: 1,
    height: '100%',
    marginHorizontal: 8,
  },
});

export default A2UIDivider;
