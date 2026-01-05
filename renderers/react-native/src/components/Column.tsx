/**
 * A2UI Column Component
 *
 * Vertical layout container for arranging children in a column.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import type { ColumnComponent, BoundValue } from '../types/a2ui-types';
import { resolveValue, resolveStyleValues } from '../state/data-model-store';

export interface A2UIColumnProps {
  component: ColumnComponent;
  dataModel: Record<string, unknown>;
  children?: React.ReactNode;
}

export const A2UIColumn: React.FC<A2UIColumnProps> = ({
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
    flexDirection: 'column',
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
    <View style={[styles.column, containerStyle, customStyle]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  column: {
    flexDirection: 'column',
  },
});

export default A2UIColumn;
