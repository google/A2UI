/**
 * A2UI Row Component
 *
 * Horizontal layout container for arranging children in a row.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import type { RowComponent, BoundValue } from '../types/a2ui-types';
import { resolveValue, resolveStyleValues } from '../state/data-model-store';

export interface A2UIRowProps {
  component: RowComponent;
  dataModel: Record<string, unknown>;
  children?: React.ReactNode;
}

export const A2UIRow: React.FC<A2UIRowProps> = ({
  component,
  dataModel,
  children,
}) => {
  // Resolve visibility
  const visible = component.visible !== undefined
    ? resolveValue(component.visible, dataModel)
    : true;

  if (!visible) {
    return null;
  }

  // Resolve gap
  const gap = component.gap !== undefined
    ? (resolveValue(component.gap, dataModel) as number)
    : 0;

  // Build container style
  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    gap,
  };

  if (component.justifyContent) {
    containerStyle.justifyContent = component.justifyContent;
  }

  if (component.alignItems) {
    containerStyle.alignItems = component.alignItems;
  }

  // Resolve any custom style BoundValues
  const customStyle = resolveStyleValues(
    component.style as Record<string, BoundValue | string | number> | undefined,
    dataModel
  );

  return (
    <View style={[styles.row, containerStyle, customStyle]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
});

export default A2UIRow;
