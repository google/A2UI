/**
 * A2UI Card Component
 *
 * Container with elevation/shadow and rounded corners.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import type { CardComponent, BoundValue } from '../types/a2ui-types';
import { resolveValue, resolveStyleValues } from '../state/data-model-store';

export interface A2UICardProps {
  component: CardComponent;
  dataModel: Record<string, unknown>;
  children?: React.ReactNode;
}

export const A2UICard: React.FC<A2UICardProps> = ({
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

  // Build card style
  const cardStyle: ViewStyle = {};

  // Apply elevation
  const elevation = component.elevation ?? 2;
  if (Platform.OS === 'android') {
    cardStyle.elevation = elevation;
  } else {
    // iOS shadow
    cardStyle.shadowColor = '#000';
    cardStyle.shadowOffset = {
      width: 0,
      height: elevation / 2,
    };
    cardStyle.shadowOpacity = 0.1 + elevation * 0.02;
    cardStyle.shadowRadius = elevation;
  }

  // Apply border radius
  if (component.borderRadius !== undefined) {
    cardStyle.borderRadius = component.borderRadius;
  }

  // Apply padding
  if (component.padding !== undefined) {
    cardStyle.padding = component.padding;
  }

  // Resolve any custom style BoundValues
  const customStyle = resolveStyleValues(
    component.style as Record<string, BoundValue | string | number> | undefined,
    dataModel
  );

  return (
    <View style={[styles.card, cardStyle, customStyle]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    // Default shadow for iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    // Default elevation for Android
    elevation: 2,
  },
});

export default A2UICard;
