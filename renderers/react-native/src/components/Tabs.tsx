/**
 * A2UI Tabs Component
 *
 * Tab-based navigation with multiple content panels.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import type { TabsComponent, ActionPayload, BoundValue } from '../types/a2ui-types';
import { resolveValue, resolveStyleValues } from '../state/data-model-store';

interface TabItem {
  id: string;
  label: BoundValue | string;
  content: string;
}

export interface A2UITabsProps {
  component: TabsComponent;
  dataModel: Record<string, unknown>;
  surfaceId: string;
  onAction?: (payload: ActionPayload) => void;
  renderChild: (childId: string) => React.ReactNode;
}

export const A2UITabs: React.FC<A2UITabsProps> = ({
  component,
  dataModel,
  surfaceId,
  onAction,
  renderChild,
}) => {
  // Resolve initial selected index
  const initialIndex = typeof component.selectedIndex === 'object'
    ? Number(resolveValue(component.selectedIndex, dataModel) ?? 0)
    : (component.selectedIndex ?? 0);

  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  // Update when dataModel changes
  useEffect(() => {
    if (component.selectedIndex !== undefined) {
      const newIndex = typeof component.selectedIndex === 'object'
        ? Number(resolveValue(component.selectedIndex, dataModel) ?? 0)
        : component.selectedIndex;
      setSelectedIndex(newIndex);
    }
  }, [component.selectedIndex, dataModel]);

  // Handle tab change
  const handleTabChange = useCallback((index: number) => {
    setSelectedIndex(index);
    if (onAction && component.onChangeAction) {
      onAction({
        actionId: component.onChangeAction,
        surfaceId,
        componentId: component.id,
        data: { selectedIndex: index },
      });
    }
  }, [onAction, component.onChangeAction, component.id, surfaceId]);

  // Resolve visibility
  const visible = component.visible !== undefined
    ? resolveValue(component.visible, dataModel)
    : true;

  if (!visible) {
    return null;
  }

  // Resolve tab items
  const tabItems: TabItem[] = component.tabs || [];

  // Resolve custom styles
  const customStyle = resolveStyleValues(
    component.style as Record<string, BoundValue | string | number> | undefined,
    dataModel
  );

  return (
    <View style={[styles.container, customStyle]}>
      {/* Tab headers */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {tabItems.map((tab: TabItem, index: number) => {
          const label = typeof tab.label === 'object'
            ? resolveValue(tab.label, dataModel)
            : tab.label;
          const isSelected = index === selectedIndex;

          return (
            <TouchableOpacity
              key={tab.id || index}
              onPress={() => handleTabChange(index)}
              style={[
                styles.tab,
                isSelected && styles.tabSelected,
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  isSelected && styles.tabTextSelected,
                ]}
              >
                {String(label)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Tab indicator line */}
      <View style={styles.indicatorContainer}>
        <View style={styles.indicatorTrack} />
      </View>

      {/* Tab content */}
      <View style={styles.content}>
        {tabItems[selectedIndex]?.content && renderChild(tabItems[selectedIndex].content)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexGrow: 0,
  },
  tabBarContent: {
    paddingHorizontal: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabSelected: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  tabTextSelected: {
    color: '#007AFF',
  },
  indicatorContainer: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  indicatorTrack: {
    height: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
});

export default A2UITabs;
