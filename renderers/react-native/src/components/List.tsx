/**
 * A2UI List Component
 *
 * Renders a list of items using FlatList for performance.
 */

import React, { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import type { ListComponent, BoundValue, ActionPayload } from '../types/a2ui-types';
import { resolveValue, resolveStyleValues, createRelativeDataContext } from '../state/data-model-store';

export interface A2UIListProps {
  component: ListComponent;
  dataModel: Record<string, unknown>;
  surfaceId: string;
  onAction?: (payload: ActionPayload) => void;
  renderItem: (itemData: unknown, index: number, itemDataModel: Record<string, unknown>) => React.ReactNode;
}

export const A2UIList: React.FC<A2UIListProps> = ({
  component,
  dataModel,
  renderItem,
}) => {
  // Resolve visibility
  const visible = component.visible !== undefined
    ? resolveValue(component.visible, dataModel)
    : true;

  // Resolve items - could be array or BoundValue
  const items = resolveValue(component.items, dataModel);

  // Key extractor - must be before any early returns
  const keyExtractor = useCallback((item: unknown, index: number) => {
    if (component.keyExtractor && typeof item === 'object' && item !== null) {
      const key = (item as Record<string, unknown>)[component.keyExtractor];
      if (key !== undefined) {
        return String(key);
      }
    }
    return String(index);
  }, [component.keyExtractor]);

  // Render item wrapper - must be before any early returns
  const renderItemWrapper = useCallback(({ item, index }: { item: unknown; index: number }) => {
    // Create a data context with the item
    const itemDataModel = createRelativeDataContext(dataModel, item, '$item');
    return (
      <View key={keyExtractor(item, index)}>
        {renderItem(item, index, itemDataModel)}
      </View>
    );
  }, [dataModel, keyExtractor, renderItem]);

  if (!visible) {
    return null;
  }

  if (!Array.isArray(items)) {
    console.warn('[A2UI List] Items must be an array, got:', typeof items);
    return null;
  }

  // Resolve any custom style BoundValues
  const customStyle = resolveStyleValues(
    component.style as Record<string, BoundValue | string | number> | undefined,
    dataModel
  );

  return (
    <FlatList
      data={items}
      keyExtractor={keyExtractor}
      renderItem={renderItemWrapper}
      style={[styles.list, customStyle]}
      contentContainerStyle={styles.contentContainer}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
});

export default A2UIList;
