/**
 * A2UI Checkbox Component
 *
 * Boolean input with label.
 */

import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type { CheckboxComponent, ActionPayload, BoundValue } from '../types/a2ui-types';
import { resolveValue, resolveStyleValues } from '../state/data-model-store';

export interface A2UICheckboxProps {
  component: CheckboxComponent;
  dataModel: Record<string, unknown>;
  surfaceId: string;
  onAction?: (payload: ActionPayload) => void;
}

export const A2UICheckbox: React.FC<A2UICheckboxProps> = ({
  component,
  dataModel,
  surfaceId,
  onAction,
}) => {
  // Resolve initial value
  const initialValue = resolveValue(component.checked, dataModel);
  const [checked, setChecked] = useState(Boolean(initialValue));

  // Update local state when dataModel changes
  useEffect(() => {
    const newValue = resolveValue(component.checked, dataModel);
    setChecked(Boolean(newValue));
  }, [component.checked, dataModel]);

  // Handle toggle - must be before any early returns
  const handleToggle = useCallback(() => {
    const newValue = !checked;
    setChecked(newValue);

    if (onAction && component.onChangeAction) {
      onAction({
        actionId: component.onChangeAction,
        surfaceId,
        componentId: component.id,
        data: { value: newValue },
      });
    }
  }, [checked, onAction, component.onChangeAction, component.id, surfaceId]);

  // Resolve visibility
  const visible = component.visible !== undefined
    ? resolveValue(component.visible, dataModel)
    : true;

  if (!visible) {
    return null;
  }

  // Resolve label
  const label = component.label !== undefined
    ? String(resolveValue(component.label, dataModel) ?? '')
    : '';

  // Resolve disabled state
  const disabled = component.disabled !== undefined
    ? Boolean(resolveValue(component.disabled, dataModel))
    : false;

  // Resolve custom styles
  const customStyle = resolveStyleValues(
    component.style as Record<string, BoundValue | string | number> | undefined,
    dataModel
  );

  return (
    <TouchableOpacity
      onPress={handleToggle}
      disabled={disabled}
      activeOpacity={0.7}
      style={[styles.container, customStyle, disabled && styles.disabled]}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </View>
      {label && (
        <Text style={[styles.label, disabled && styles.labelDisabled]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  label: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  labelDisabled: {
    color: '#999',
  },
});

export default A2UICheckbox;
