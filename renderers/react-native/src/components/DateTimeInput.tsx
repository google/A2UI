/**
 * A2UI DateTimeInput Component
 *
 * Date and/or time picker input.
 * Note: For production, consider using @react-native-community/datetimepicker
 */

import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import type { DateTimeInputComponent, ActionPayload, BoundValue } from '../types/a2ui-types';
import { resolveValue, resolveStyleValues } from '../state/data-model-store';

export interface A2UIDateTimeInputProps {
  component: DateTimeInputComponent;
  dataModel: Record<string, unknown>;
  surfaceId: string;
  onAction?: (payload: ActionPayload) => void;
}

export const A2UIDateTimeInput: React.FC<A2UIDateTimeInputProps> = ({
  component,
  dataModel,
  surfaceId,
  onAction,
}) => {
  // Resolve initial value
  const initialValue = resolveValue(component.value, dataModel);
  const [dateValue, setDateValue] = useState(String(initialValue ?? ''));

  // Update local state when dataModel changes
  useEffect(() => {
    const newValue = resolveValue(component.value, dataModel);
    setDateValue(String(newValue ?? ''));
  }, [component.value, dataModel]);

  // Determine input type based on enableDate/enableTime
  const getInputType = useCallback(() => {
    const enableDate = component.enableDate !== false;
    const enableTime = component.enableTime !== false;

    if (enableDate && enableTime) {
      return 'datetime';
    } else if (enableDate) {
      return 'date';
    } else if (enableTime) {
      return 'time';
    }
    return 'datetime';
  }, [component.enableDate, component.enableTime]);

  // Get label based on input type
  const getLabel = useCallback(() => {
    if (component.label) {
      return String(resolveValue(component.label, dataModel) ?? '');
    }

    const inputType = getInputType();
    switch (inputType) {
      case 'date':
        return 'Date';
      case 'time':
        return 'Time';
      default:
        return 'Date & Time';
    }
  }, [component.label, dataModel, getInputType]);

  // Format value for display
  const formatDisplayValue = useCallback((value: string) => {
    if (!value) return '';

    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return value;

      const inputType = getInputType();

      if (inputType === 'date') {
        return date.toLocaleDateString();
      } else if (inputType === 'time') {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleString();
    } catch {
      return value;
    }
  }, [getInputType]);

  // Handle value change
  const handleChange = useCallback((text: string) => {
    setDateValue(text);

    if (onAction && component.onChangeAction) {
      onAction({
        actionId: component.onChangeAction,
        surfaceId,
        componentId: component.id,
        data: { value: text },
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

  const label = getLabel();
  const inputType = getInputType();

  // Resolve custom styles
  const customStyle = resolveStyleValues(
    component.style as Record<string, BoundValue | string | number> | undefined,
    dataModel
  );

  // Get placeholder based on input type
  const getPlaceholder = () => {
    switch (inputType) {
      case 'date':
        return 'YYYY-MM-DD';
      case 'time':
        return 'HH:MM';
      default:
        return 'YYYY-MM-DD HH:MM';
    }
  };

  return (
    <View style={[styles.container, customStyle]}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={dateValue}
          onChangeText={handleChange}
          placeholder={getPlaceholder()}
          placeholderTextColor="#999"
          keyboardType={Platform.OS === 'ios' ? 'default' : 'default'}
        />
        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.icon}>
            {inputType === 'time' ? '🕐' : '📅'}
          </Text>
        </TouchableOpacity>
      </View>

      {dateValue && (
        <Text style={styles.displayValue}>
          {formatDisplayValue(dateValue)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
  },
  iconButton: {
    padding: 10,
  },
  icon: {
    fontSize: 20,
  },
  displayValue: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
});

export default A2UIDateTimeInput;
