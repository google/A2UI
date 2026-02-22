/**
 * A2UI React Native Complete Demo
 *
 * Demonstrates ALL A2UI components including new additions.
 * Use this as a reference for component usage.
 */

import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  A2UIRenderer,
  A2UIThemeProvider,
  ActionPayload,
} from '../src';

// Complete A2UI spec demonstrating all components
const completeSpec = {
  surfaceId: 'complete-demo',
  rootId: 'root',
  components: [
    // Root column layout
    {
      id: 'root',
      type: 'Column' as const,
      children: [
        'header',
        'divider1',
        'text-section',
        'divider2',
        'input-section',
        'divider3',
        'selection-section',
        'divider4',
        'media-section',
        'divider5',
        'interactive-section',
      ],
      style: { padding: 16 },
    },

    // Header
    {
      id: 'header',
      type: 'Text' as const,
      content: 'A2UI Component Showcase',
      textStyle: {
        fontSize: 28,
        fontWeight: 'bold' as const,
        color: '#1a1a1a',
        textAlign: 'center' as const,
      },
    },

    // Dividers
    { id: 'divider1', type: 'Divider' as const, thickness: 1, color: '#e0e0e0' },
    { id: 'divider2', type: 'Divider' as const, thickness: 1, color: '#e0e0e0' },
    { id: 'divider3', type: 'Divider' as const, thickness: 1, color: '#e0e0e0' },
    { id: 'divider4', type: 'Divider' as const, thickness: 1, color: '#e0e0e0' },
    { id: 'divider5', type: 'Divider' as const, thickness: 1, color: '#e0e0e0' },

    // Text Section
    {
      id: 'text-section',
      type: 'Card' as const,
      children: ['text-title', 'text-row'],
      style: { marginVertical: 8 },
    },
    {
      id: 'text-title',
      type: 'Text' as const,
      content: 'Text & Icons',
      textStyle: { fontSize: 18, fontWeight: '600' as const },
    },
    {
      id: 'text-row',
      type: 'Row' as const,
      children: ['icon-home', 'text-home', 'icon-settings', 'text-settings'],
      style: { alignItems: 'center', marginTop: 8, gap: 8 },
    },
    { id: 'icon-home', type: 'Icon' as const, name: 'home', size: 24, color: '#007AFF' },
    { id: 'text-home', type: 'Text' as const, content: 'Home' },
    { id: 'icon-settings', type: 'Icon' as const, name: 'settings', size: 24, color: '#666' },
    { id: 'text-settings', type: 'Text' as const, content: 'Settings' },

    // Input Section
    {
      id: 'input-section',
      type: 'Card' as const,
      children: ['input-title', 'text-input', 'datetime-input'],
      style: { marginVertical: 8 },
    },
    {
      id: 'input-title',
      type: 'Text' as const,
      content: 'Input Components',
      textStyle: { fontSize: 18, fontWeight: '600' as const },
    },
    {
      id: 'text-input',
      type: 'TextField' as const,
      value: { type: 'path' as const, path: ['username'] },
      placeholder: 'Enter your name',
      label: 'Username',
      onChangeAction: 'username_changed',
    },
    {
      id: 'datetime-input',
      type: 'DateTimeInput' as const,
      value: { type: 'path' as const, path: ['selectedDate'] },
      label: 'Select Date',
      enableDate: true,
      enableTime: false,
      onChangeAction: 'date_changed',
    },

    // Selection Section
    {
      id: 'selection-section',
      type: 'Card' as const,
      children: ['selection-title', 'checkbox-row', 'slider-demo', 'dropdown-demo'],
      style: { marginVertical: 8 },
    },
    {
      id: 'selection-title',
      type: 'Text' as const,
      content: 'Selection Components',
      textStyle: { fontSize: 18, fontWeight: '600' as const },
    },
    {
      id: 'checkbox-row',
      type: 'Column' as const,
      children: ['checkbox1', 'checkbox2'],
      style: { marginVertical: 8 },
    },
    {
      id: 'checkbox1',
      type: 'Checkbox' as const,
      checked: { type: 'path' as const, path: ['notifications'] },
      label: 'Enable notifications',
      onChangeAction: 'toggle_notifications',
    },
    {
      id: 'checkbox2',
      type: 'Checkbox' as const,
      checked: { type: 'path' as const, path: ['darkMode'] },
      label: 'Dark mode',
      onChangeAction: 'toggle_dark_mode',
    },
    {
      id: 'slider-demo',
      type: 'Column' as const,
      children: ['slider-label', 'slider1'],
      style: { marginVertical: 8 },
    },
    {
      id: 'slider-label',
      type: 'Text' as const,
      content: 'Volume',
      textStyle: { fontWeight: '500' as const },
    },
    {
      id: 'slider1',
      type: 'Slider' as const,
      value: { type: 'path' as const, path: ['volume'] },
      min: 0,
      max: 100,
      step: 1,
      onChangeAction: 'volume_changed',
    },
    {
      id: 'dropdown-demo',
      type: 'MultipleChoice' as const,
      selections: { type: 'path' as const, path: ['country'] },
      label: 'Country',
      placeholder: 'Select your country',
      options: [
        { value: 'us', label: 'United States' },
        { value: 'uk', label: 'United Kingdom' },
        { value: 'ca', label: 'Canada' },
        { value: 'au', label: 'Australia' },
      ],
      onChangeAction: 'country_changed',
    },

    // Media Section
    {
      id: 'media-section',
      type: 'Card' as const,
      children: ['media-title', 'image-demo', 'video-demo', 'audio-demo'],
      style: { marginVertical: 8 },
    },
    {
      id: 'media-title',
      type: 'Text' as const,
      content: 'Media Components',
      textStyle: { fontSize: 18, fontWeight: '600' as const },
    },
    {
      id: 'image-demo',
      type: 'Image' as const,
      src: 'https://via.placeholder.com/300x150/007AFF/FFFFFF?text=A2UI+Image',
      alt: 'Placeholder image',
      style: { borderRadius: 8, marginVertical: 8 },
    },
    {
      id: 'video-demo',
      type: 'Video' as const,
      url: 'https://example.com/sample-video.mp4',
      poster: 'https://via.placeholder.com/300x169/333/FFF?text=Video',
      onPlayAction: 'video_played',
    },
    {
      id: 'audio-demo',
      type: 'AudioPlayer' as const,
      url: 'https://example.com/sample-audio.mp3',
      title: 'Sample Audio Track',
      onPlayAction: 'audio_played',
    },

    // Interactive Section
    {
      id: 'interactive-section',
      type: 'Card' as const,
      children: ['interactive-title', 'button-row', 'tabs-demo', 'modal-trigger'],
      style: { marginVertical: 8 },
    },
    {
      id: 'interactive-title',
      type: 'Text' as const,
      content: 'Interactive Components',
      textStyle: { fontSize: 18, fontWeight: '600' as const },
    },
    {
      id: 'button-row',
      type: 'Row' as const,
      children: ['btn-primary', 'btn-secondary', 'btn-outline'],
      style: { justifyContent: 'space-around', marginVertical: 8, flexWrap: 'wrap', gap: 8 },
    },
    {
      id: 'btn-primary',
      type: 'Button' as const,
      label: 'Primary',
      action: 'primary_action',
      variant: 'primary' as const,
    },
    {
      id: 'btn-secondary',
      type: 'Button' as const,
      label: 'Secondary',
      action: 'secondary_action',
      variant: 'secondary' as const,
    },
    {
      id: 'btn-outline',
      type: 'Button' as const,
      label: 'Outline',
      action: 'outline_action',
      variant: 'outline' as const,
    },
    {
      id: 'tabs-demo',
      type: 'Tabs' as const,
      selectedIndex: { type: 'path' as const, path: ['activeTab'] },
      tabs: [
        { id: 'tab1', label: 'Overview', content: 'tab1-content' },
        { id: 'tab2', label: 'Details', content: 'tab2-content' },
        { id: 'tab3', label: 'Settings', content: 'tab3-content' },
      ],
      onChangeAction: 'tab_changed',
    },
    {
      id: 'tab1-content',
      type: 'Text' as const,
      content: 'This is the Overview tab content.',
    },
    {
      id: 'tab2-content',
      type: 'Text' as const,
      content: 'This is the Details tab with more information.',
    },
    {
      id: 'tab3-content',
      type: 'Text' as const,
      content: 'Settings and configuration options go here.',
    },
    {
      id: 'modal-trigger',
      type: 'Modal' as const,
      entryPoint: 'modal-btn',
      content: 'modal-content',
      onDismissAction: 'modal_dismissed',
    },
    {
      id: 'modal-btn',
      type: 'Button' as const,
      label: 'Open Modal',
      action: 'open_modal',
      variant: 'outline' as const,
    },
    {
      id: 'modal-content',
      type: 'Column' as const,
      children: ['modal-title', 'modal-body', 'modal-close'],
      style: { padding: 20 },
    },
    {
      id: 'modal-title',
      type: 'Text' as const,
      content: 'Modal Dialog',
      textStyle: { fontSize: 20, fontWeight: '600' as const },
    },
    {
      id: 'modal-body',
      type: 'Text' as const,
      content: 'This is a modal dialog rendered by A2UI. Tap outside or press the button to close.',
      style: { marginVertical: 16 },
    },
    {
      id: 'modal-close',
      type: 'Button' as const,
      label: 'Close',
      action: 'close_modal',
      variant: 'primary' as const,
    },
  ],
  dataModel: {
    username: '',
    selectedDate: '',
    notifications: true,
    darkMode: false,
    volume: 50,
    country: '',
    activeTab: 0,
  },
};

export default function CompleteDemo() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [lastAction, setLastAction] = useState<ActionPayload | null>(null);

  const handleAction = (payload: ActionPayload) => {
    console.log('Action received:', payload);
    setLastAction(payload);

    // Handle dark mode toggle
    if (payload.actionId === 'toggle_dark_mode') {
      setIsDarkMode(!isDarkMode);
    }
  };

  return (
    <A2UIThemeProvider theme={isDarkMode ? 'dark' : 'light'}>
      <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Theme toggle */}
          <View style={styles.themeToggle}>
            <TouchableOpacity
              style={[styles.themeButton, !isDarkMode && styles.activeTheme]}
              onPress={() => setIsDarkMode(false)}
            >
              <Text style={[styles.themeText, !isDarkMode && styles.activeThemeText]}>Light</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.themeButton, isDarkMode && styles.activeTheme]}
              onPress={() => setIsDarkMode(true)}
            >
              <Text style={[styles.themeText, isDarkMode && styles.activeThemeText]}>Dark</Text>
            </TouchableOpacity>
          </View>

          {/* Render the complete A2UI spec */}
          <A2UIRenderer spec={completeSpec} onAction={handleAction} />

          {/* Show last action for debugging */}
          {lastAction && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugTitle}>Last Action:</Text>
              <Text style={styles.debugText}>
                {JSON.stringify(lastAction, null, 2)}
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </A2UIThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  darkContainer: {
    backgroundColor: '#1c1c1e',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  themeToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  themeButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 4,
  },
  activeTheme: {
    backgroundColor: '#007AFF',
  },
  themeText: {
    fontSize: 14,
    color: '#666',
  },
  activeThemeText: {
    color: '#fff',
    fontWeight: '600',
  },
  debugContainer: {
    marginTop: 24,
    padding: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  debugTitle: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#856404',
  },
  debugText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#856404',
  },
});
