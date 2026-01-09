/**
 * A2UI Component Type Definitions
 * Based on A2UI Specification v0.9
 */

import type { CSSProperties } from 'react';

// =============================================================================
// CORE TYPES
// =============================================================================

export interface PathReference {
  path: string;
}

export type A2UIValue<T> = T | PathReference;

/**
 * A2UI Action format
 * Supports both spec-based and protocol-based formats:
 * - Spec format: { type: 'submit', params: { key: 'value' } }
 * - Protocol format: { name: 'submit', context: { key: 'value' } }
 */
export interface A2UIAction {
  /** Action type (spec-based format) - deprecated, use name */
  type?: string;
  /** Action name (protocol format) */
  name?: string;
  /** Component that triggered the action */
  componentId?: string;
  /** Action parameters (spec-based format) */
  params?: Record<string, unknown>;
  /** Action context (protocol format) - alias for params */
  context?: Record<string, unknown>;
  /** Action string (shorthand) - either type, name, or action */
  action?: string;
}

export interface A2UIComponentSpec {
  component: string;
  id?: string;
  weight?: number;
  [key: string]: unknown;
}

// =============================================================================
// THEME
// =============================================================================

export interface A2UITheme {
  mode: 'light' | 'dark';
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    error: string;
    success: string;
    warning: string;
  };
  typography: Record<string, CSSProperties>;
  spacing: (factor: number) => number;
  borderRadius: number;
  font: string;
}

export interface A2UIContextValue {
  data: Record<string, unknown>;
  theme: A2UITheme;
  dispatch: (action: A2UIAction) => void;
}

// =============================================================================
// COMPONENT SPECS
// =============================================================================

export interface TextSpec extends A2UIComponentSpec {
  component: 'Text';
  text: A2UIValue<string>;
  usageHint?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'caption' | 'body';
}

export interface ImageSpec extends A2UIComponentSpec {
  component: 'Image';
  url: A2UIValue<string>;
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  usageHint?: 'icon' | 'avatar' | 'smallFeature' | 'mediumFeature' | 'largeFeature' | 'header';
}

export interface IconSpec extends A2UIComponentSpec {
  component: 'Icon';
  name: string;
}

export interface VideoSpec extends A2UIComponentSpec {
  component: 'Video';
  url: A2UIValue<string>;
}

export interface AudioPlayerSpec extends A2UIComponentSpec {
  component: 'AudioPlayer';
  url: A2UIValue<string>;
  description?: A2UIValue<string>;
}

export interface RowSpec extends A2UIComponentSpec {
  component: 'Row';
  children: A2UIComponentSpec[];
  distribution?: 'start' | 'center' | 'end' | 'spaceAround' | 'spaceBetween' | 'spaceEvenly';
  alignment?: 'start' | 'center' | 'end' | 'stretch';
}

export interface ColumnSpec extends A2UIComponentSpec {
  component: 'Column';
  children: A2UIComponentSpec[];
  distribution?: 'start' | 'center' | 'end' | 'spaceAround' | 'spaceBetween' | 'spaceEvenly';
  alignment?: 'start' | 'center' | 'end' | 'stretch';
}

export interface ListSpec extends A2UIComponentSpec {
  component: 'List';
  children?: A2UIComponentSpec[];
  direction?: 'vertical' | 'horizontal';
  alignment?: 'start' | 'center' | 'end' | 'stretch';
  items?: A2UIValue<unknown[]>;
  itemTemplate?: A2UIComponentSpec;
}

export interface CardSpec extends A2UIComponentSpec {
  component: 'Card';
  child: A2UIComponentSpec;
}

export interface TabItem {
  title: string;
  child: A2UIComponentSpec;
}

export interface TabsSpec extends A2UIComponentSpec {
  component: 'Tabs';
  tabItems: TabItem[];
  selectedIndex?: number;
}

export interface DividerSpec extends A2UIComponentSpec {
  component: 'Divider';
  axis?: 'horizontal' | 'vertical';
}

export interface ModalSpec extends A2UIComponentSpec {
  component: 'Modal';
  entryPointChild: A2UIComponentSpec;
  contentChild: A2UIComponentSpec;
  title?: string;
}

export interface ButtonSpec extends A2UIComponentSpec {
  component: 'Button';
  child: A2UIComponentSpec;
  primary?: boolean;
  action: A2UIAction;
}

export interface CheckBoxSpec extends A2UIComponentSpec {
  component: 'CheckBox';
  label: A2UIValue<string>;
  value: A2UIValue<boolean>;
  onChange?: A2UIAction;
}

export interface TextFieldSpec extends A2UIComponentSpec {
  component: 'TextField';
  label?: string;
  text?: A2UIValue<string>;
  usageHint?: 'shortText' | 'longText' | 'number' | 'obscured';
  validationRegexp?: string;
  onSubmit?: A2UIAction;
  onChange?: A2UIAction;
}

export interface DateTimeInputSpec extends A2UIComponentSpec {
  component: 'DateTimeInput';
  value: A2UIValue<string>;
  enableDate?: boolean;
  enableTime?: boolean;
  outputFormat?: string;
  label?: string;
  onChange?: A2UIAction;
}

export interface ChoiceOption {
  label: string;
  value: string;
}

export interface ChoicePickerSpec extends A2UIComponentSpec {
  component: 'ChoicePicker';
  label?: string;
  usageHint: 'multipleSelection' | 'mutuallyExclusive';
  options: ChoiceOption[];
  value: A2UIValue<string | string[]>;
  onChange?: A2UIAction;
}

export interface SliderSpec extends A2UIComponentSpec {
  component: 'Slider';
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  value: A2UIValue<number>;
  onChange?: A2UIAction;
}
