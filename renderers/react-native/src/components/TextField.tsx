/**
 * A2UI TextField Component
 *
 * Text input field with optional label and validation.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import type { TextFieldComponent, ActionPayload, BoundValue } from '../types/a2ui-types';
import { resolveValue, resolveStyleValues } from '../state/data-model-store';

export interface A2UITextFieldProps {
  component: TextFieldComponent;
  dataModel: Record<string, unknown>;
  surfaceId: string;
  onAction?: (payload: ActionPayload) => void;
}

export const A2UITextField: React.FC<A2UITextFieldProps> = ({
  component,
  dataModel,
  surfaceId,
  onAction,
}) => {
  // Resolve initial value
  const initialValue = resolveValue(component.value, dataModel);
  const [localValue, setLocalValue] = useState(String(initialValue ?? ''));

  // Resolve visibility
  const visible = component.visible !== undefined
    ? resolveValue(component.visible, dataModel)
    : true;

  // Handle text change - must be before any early returns
  const handleChange = useCallback((text: string) => {
    setLocalValue(text);

    if (onAction && component.onChangeAction) {
      onAction({
        actionId: component.onChangeAction,
        surfaceId,
        componentId: component.id,
        data: { value: text },
      });
    }
  }, [onAction, component.onChangeAction, component.id, surfaceId]);

  if (!visible) {
    return null;
  }

  // Resolve placeholder
  const placeholder = component.placeholder !== undefined
    ? String(resolveValue(component.placeholder, dataModel) ?? '')
    : undefined;

  // Resolve label
  const label = component.label !== undefined
    ? String(resolveValue(component.label, dataModel) ?? '')
    : undefined;

  // Resolve any custom style BoundValues
  const customStyle = resolveStyleValues(
    component.style as Record<string, BoundValue | string | number> | undefined,
    dataModel
  );

  return (
    <View style={[styles.container, customStyle]}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <TextInput
        style={[
          styles.input,
          component.multiline && styles.multilineInput,
        ]}
        value={localValue}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor="#8E8E93"
        multiline={component.multiline}
        maxLength={component.maxLength}
        keyboardType={component.keyboardType || 'default'}
        secureTextEntry={component.secureTextEntry}
        accessibilityLabel={label || placeholder}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3C3C43',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#C6C6C8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#FFFFFF',
    minHeight: 44,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
});

export default A2UITextField;
