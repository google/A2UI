/**
 * A2UI Icon Component
 *
 * Displays an icon by name.
 * Note: For production, integrate with react-native-vector-icons or similar.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { IconComponent, BoundValue } from '../types/a2ui-types';
import { resolveValue, resolveStyleValues } from '../state/data-model-store';

export interface A2UIIconProps {
  component: IconComponent;
  dataModel: Record<string, unknown>;
}

// Basic icon mapping using emoji/unicode as fallback
// In production, replace with react-native-vector-icons
const ICON_MAP: Record<string, string> = {
  // Navigation
  'home': '🏠',
  'menu': '☰',
  'back': '←',
  'forward': '→',
  'up': '↑',
  'down': '↓',
  'close': '✕',
  'check': '✓',

  // Actions
  'add': '+',
  'remove': '−',
  'edit': '✏️',
  'delete': '🗑️',
  'search': '🔍',
  'settings': '⚙️',
  'refresh': '🔄',
  'share': '📤',
  'download': '⬇️',
  'upload': '⬆️',

  // Status
  'info': 'ℹ️',
  'warning': '⚠️',
  'error': '❌',
  'success': '✅',
  'loading': '⏳',

  // Communication
  'email': '📧',
  'phone': '📞',
  'message': '💬',
  'notification': '🔔',

  // Content
  'file': '📄',
  'folder': '📁',
  'image': '🖼️',
  'video': '🎬',
  'audio': '🎵',
  'calendar': '📅',
  'clock': '🕐',
  'location': '📍',

  // User
  'user': '👤',
  'users': '👥',
  'star': '⭐',
  'heart': '❤️',
  'bookmark': '🔖',

  // Media controls
  'play': '▶️',
  'pause': '⏸️',
  'stop': '⏹️',
  'next': '⏭️',
  'previous': '⏮️',
  'volume': '🔊',
  'mute': '🔇',
};

export const A2UIIcon: React.FC<A2UIIconProps> = ({
  component,
  dataModel,
}) => {
  // Resolve visibility
  const visible = component.visible !== undefined
    ? resolveValue(component.visible, dataModel)
    : true;

  if (!visible) {
    return null;
  }

  // Resolve icon name
  const iconName = String(resolveValue(component.name, dataModel) ?? '');

  if (!iconName) {
    return null;
  }

  // Resolve size
  const size = typeof component.size === 'object'
    ? Number(resolveValue(component.size, dataModel) ?? 24)
    : (component.size ?? 24);

  // Resolve color
  const color = typeof component.color === 'object'
    ? String(resolveValue(component.color, dataModel) ?? '#333')
    : (component.color ?? '#333');

  // Resolve custom styles
  const customStyle = resolveStyleValues(
    component.style as Record<string, BoundValue | string | number> | undefined,
    dataModel
  );

  // Get icon character
  const iconChar = ICON_MAP[iconName.toLowerCase()] || iconName;

  return (
    <View style={[styles.container, customStyle]}>
      <Text style={[styles.icon, { fontSize: size, color }]}>
        {iconChar}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    textAlign: 'center',
  },
});

export default A2UIIcon;
