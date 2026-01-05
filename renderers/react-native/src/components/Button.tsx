/**
 * A2UI Button Component
 *
 * Renders an interactive button with customizable appearance.
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import type { ButtonComponent, ActionPayload, BoundValue } from '../types/a2ui-types';
import { resolveValue, resolveStyleValues } from '../state/data-model-store';

export interface A2UIButtonProps {
  component: ButtonComponent;
  dataModel: Record<string, unknown>;
  surfaceId: string;
  onAction?: (payload: ActionPayload) => void;
}

export const A2UIButton: React.FC<A2UIButtonProps> = ({
  component,
  dataModel,
  surfaceId,
  onAction,
}) => {
  // Resolve label
  const label = resolveValue(component.label, dataModel);

  // Resolve disabled state
  const disabled = component.disabled !== undefined
    ? Boolean(resolveValue(component.disabled, dataModel))
    : false;

  // Resolve visibility
  const visible = component.visible !== undefined
    ? resolveValue(component.visible, dataModel)
    : true;

  // Handle press - must be before any early returns
  const handlePress = useCallback(() => {
    if (disabled) return;

    if (onAction && component.action) {
      onAction({
        actionId: component.action,
        surfaceId,
        componentId: component.id,
      });
    }
  }, [disabled, onAction, component.action, component.id, surfaceId]);

  if (!visible) {
    return null;
  }

  // Get variant styles
  const variant = component.variant || 'primary';
  const variantStyles = getVariantStyles(variant, disabled);

  // Resolve any custom style BoundValues
  const customStyle = resolveStyleValues(
    component.style as Record<string, BoundValue | string | number> | undefined,
    dataModel
  );

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variantStyles.button,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        customStyle,
      ]}
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={String(label ?? '')}
      accessibilityState={{ disabled }}
    >
      <Text style={[styles.label, variantStyles.label, disabled && styles.labelDisabled]}>
        {String(label ?? '')}
      </Text>
    </Pressable>
  );
};

function getVariantStyles(
  variant: 'primary' | 'secondary' | 'outline' | 'text',
  _disabled: boolean
): { button: ViewStyle; label: TextStyle } {
  switch (variant) {
    case 'primary':
      return {
        button: {
          backgroundColor: '#007AFF',
        },
        label: {
          color: '#FFFFFF',
        },
      };

    case 'secondary':
      return {
        button: {
          backgroundColor: '#E5E5EA',
        },
        label: {
          color: '#000000',
        },
      };

    case 'outline':
      return {
        button: {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: '#007AFF',
        },
        label: {
          color: '#007AFF',
        },
      };

    case 'text':
      return {
        button: {
          backgroundColor: 'transparent',
        },
        label: {
          color: '#007AFF',
        },
      };

    default:
      return {
        button: {
          backgroundColor: '#007AFF',
        },
        label: {
          color: '#FFFFFF',
        },
      };
  }
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  labelDisabled: {
    color: '#8E8E93',
  },
});

export default A2UIButton;
