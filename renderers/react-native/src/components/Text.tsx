/**
 * A2UI Text Component
 *
 * Renders text content with optional styling.
 */

import React from 'react';
import { Text as RNText, StyleSheet, TextStyle } from 'react-native';
import type { TextComponent, BoundValue } from '../types/a2ui-types';
import { resolveValue, resolveStyleValues } from '../state/data-model-store';

export interface A2UITextProps {
  component: TextComponent;
  dataModel: Record<string, unknown>;
}

export const A2UIText: React.FC<A2UITextProps> = ({ component, dataModel }) => {
  // Resolve content - could be string or BoundValue
  const content = resolveValue(component.content, dataModel);

  // Resolve visibility
  const visible = component.visible !== undefined
    ? resolveValue(component.visible, dataModel)
    : true;

  if (!visible) {
    return null;
  }

  // Build style from component props
  const textStyle: TextStyle = {};

  if (component.textStyle) {
    if (component.textStyle.fontSize) {
      textStyle.fontSize = component.textStyle.fontSize;
    }
    if (component.textStyle.fontWeight) {
      textStyle.fontWeight = component.textStyle.fontWeight;
    }
    if (component.textStyle.color) {
      textStyle.color = component.textStyle.color;
    }
    if (component.textStyle.textAlign) {
      textStyle.textAlign = component.textStyle.textAlign;
    }
  }

  // Resolve any custom style BoundValues
  const customStyle = resolveStyleValues(
    component.style as Record<string, BoundValue | string | number> | undefined,
    dataModel
  );

  return (
    <RNText style={[styles.text, textStyle, customStyle]}>
      {String(content ?? '')}
    </RNText>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    color: '#000000',
  },
});

export default A2UIText;
