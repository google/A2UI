/*
 * A2UI types for NativeScript sample app.
 * 
 * Re-exports standard types from @a2ui/nativescript and defines
 * custom extensions for the demo app (SimpleNode, extended A2uiMessage).
 * 
 * Copyright 2025 Google LLC - Apache License 2.0
 */

// Re-export standard types from the renderer package
export { Types, Primitives } from '@a2ui/nativescript';

// Import types we need to extend
import { Types } from '@a2ui/nativescript';

// ============ Custom Extensions for Demo App ============

/**
 * Action type - used for button actions, menu items, etc.
 */
export interface Action {
  name: string;
  id?: string;
  label?: string;
  type?: string;
  payload?: Record<string, unknown>;
  context?: {
    key: string;
    value: {
      path?: string;
      literalString?: string;
      literalNumber?: number;
      literalBoolean?: boolean;
    };
  }[];
}

/**
 * Simplified node type for demo/inline surfaces.
 * This makes it easier to define UI trees inline without the full
 * component schema complexity.
 */
export interface SimpleNode {
  type: string;
  id: string;
  children?: SimpleNode[];
  text?: string;
  textStyle?: 'headline' | 'title' | 'subtitle' | 'body' | 'caption' | 'code';
  title?: string;
  subtitle?: string;
  label?: string;
  variant?: 'primary' | 'secondary' | 'tertiary';
  url?: string;
  src?: string;
  fit?: 'cover' | 'contain' | 'fill';
  usageHint?: string;
  placeholder?: string;
  value?: string;
  helperText?: string;
  secure?: boolean;
  orientation?: 'horizontal' | 'vertical';
  direction?: 'horizontal' | 'vertical';
  height?: number;
  width?: number | string;
  weight?: number | string;
  horizontalAlignment?: 'start' | 'center' | 'end' | 'spaceBetween' | 'spaceAround';
  verticalAlignment?: 'top' | 'center' | 'bottom';
  action?: Action;
  actions?: Action[];
  items?: SimpleNode[];
  leading?: SimpleNode;
  trailing?: SimpleNode;
  child?: SimpleNode;
}

/**
 * Extended A2UI message type that supports SimpleNode for demo surfaces.
 */
export interface A2uiMessage {
  root?: Types.AnyComponentNode | SimpleNode;
  surfaceId?: string;
  data?: Record<string, Types.DataValue>;
  dataModels?: Types.DataMap;
}
