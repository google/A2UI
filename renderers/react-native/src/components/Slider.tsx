/**
 * A2UI Slider Component
 *
 * Range input slider for numeric values.
 * Note: For production, consider using @react-native-community/slider
 */

import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import type { SliderComponent, ActionPayload, BoundValue } from '../types/a2ui-types';
import { resolveValue, resolveStyleValues } from '../state/data-model-store';

export interface A2UISliderProps {
  component: SliderComponent;
  dataModel: Record<string, unknown>;
  surfaceId: string;
  onAction?: (payload: ActionPayload) => void;
}

export const A2UISlider: React.FC<A2UISliderProps> = ({
  component,
  dataModel,
  surfaceId,
  onAction,
}) => {
  // Resolve min/max values
  const minValue = component.min ?? 0;
  const maxValue = component.max ?? 100;

  // Resolve initial value
  const initialValue = resolveValue(component.value, dataModel);
  const [value, setValue] = useState(Number(initialValue) || minValue);
  const [trackWidth, setTrackWidth] = useState(0);

  // Update local state when dataModel changes
  useEffect(() => {
    const newValue = resolveValue(component.value, dataModel);
    setValue(Number(newValue) || minValue);
  }, [component.value, dataModel, minValue]);

  // Calculate thumb position
  const getThumbPosition = useCallback(() => {
    const range = maxValue - minValue;
    if (range === 0) return 0;
    const percentage = (value - minValue) / range;
    return percentage * trackWidth;
  }, [value, minValue, maxValue, trackWidth]);

  // Handle value change from pan
  const handleValueChange = useCallback((newValue: number) => {
    const clampedValue = Math.max(minValue, Math.min(maxValue, newValue));
    const roundedValue = Math.round(clampedValue * 100) / 100;
    setValue(roundedValue);

    if (onAction && component.onChangeAction) {
      onAction({
        actionId: component.onChangeAction,
        surfaceId,
        componentId: component.id,
        data: { value: roundedValue },
      });
    }
  }, [minValue, maxValue, onAction, component.onChangeAction, component.id, surfaceId]);

  // Pan responder for touch handling
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const x = evt.nativeEvent.locationX;
        const percentage = Math.max(0, Math.min(1, x / trackWidth));
        const newValue = minValue + percentage * (maxValue - minValue);
        handleValueChange(newValue);
      },
      onPanResponderMove: (evt) => {
        const x = evt.nativeEvent.locationX;
        const percentage = Math.max(0, Math.min(1, x / trackWidth));
        const newValue = minValue + percentage * (maxValue - minValue);
        handleValueChange(newValue);
      },
    })
  ).current;

  // Handle layout to get track width
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  }, []);

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

  // Resolve custom styles
  const customStyle = resolveStyleValues(
    component.style as Record<string, BoundValue | string | number> | undefined,
    dataModel
  );

  const thumbPosition = getThumbPosition();

  return (
    <View style={[styles.container, customStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.valueLabel}>{value}</Text>
        </View>
      )}

      <View
        style={styles.trackContainer}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        <View style={styles.track}>
          <View style={[styles.trackFilled, { width: thumbPosition }]} />
        </View>
        <View style={[styles.thumb, { left: thumbPosition - 12 }]} />
      </View>

      <View style={styles.rangeLabels}>
        <Text style={styles.rangeLabel}>{minValue}</Text>
        <Text style={styles.rangeLabel}>{maxValue}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  valueLabel: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  trackContainer: {
    height: 40,
    justifyContent: 'center',
  },
  track: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  trackFilled: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  rangeLabel: {
    fontSize: 12,
    color: '#999',
  },
});

export default A2UISlider;
