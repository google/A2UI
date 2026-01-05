/**
 * A2UI Type Definitions
 * Based on the A2UI specification from Google
 * https://a2ui.org/
 */

import type React from 'react';

// =============================================================================
// Bound Values - For data binding
// =============================================================================

export interface LiteralBoundValue {
  type: 'literal';
  value: string | number | boolean | null;
}

export interface PathBoundValue {
  type: 'path';
  path: string[];
}

export type BoundValue = LiteralBoundValue | PathBoundValue;

// =============================================================================
// Base Component Definition
// =============================================================================

export interface BaseComponent {
  id: string;
  type: string;
  children?: string[]; // IDs of child components
  style?: Record<string, BoundValue | string | number>;
  visible?: BoundValue | boolean;
}


// =============================================================================
// Content Components
// =============================================================================

export interface TextComponent extends BaseComponent {
  type: 'Text';
  content: BoundValue | string;
  textStyle?: {
    fontSize?: number;
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
  };
}

export interface ImageComponent extends BaseComponent {
  type: 'Image';
  src: BoundValue | string;
  alt?: BoundValue | string;
  width?: BoundValue | number;
  height?: BoundValue | number;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

export interface IconComponent extends BaseComponent {
  type: 'Icon';
  name: BoundValue | string;
  size?: BoundValue | number;
  color?: BoundValue | string;
}

export interface DividerComponent extends BaseComponent {
  type: 'Divider';
  thickness?: number;
  color?: string;
}

// =============================================================================
// Layout Components
// =============================================================================

export interface RowComponent extends BaseComponent {
  type: 'Row';
  gap?: BoundValue | number;
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
}

export interface ColumnComponent extends BaseComponent {
  type: 'Column';
  gap?: BoundValue | number;
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
}

export interface CardComponent extends BaseComponent {
  type: 'Card';
  elevation?: number;
  borderRadius?: number;
  padding?: number;
}

export interface ListComponent extends BaseComponent {
  type: 'List';
  items: BoundValue | unknown[];
  itemTemplate: string; // Component ID to use as template
  keyExtractor?: string; // Path to key field in item
}

// =============================================================================
// Interactive Components
// =============================================================================

export interface ButtonComponent extends BaseComponent {
  type: 'Button';
  label: BoundValue | string;
  action: string; // Action ID to trigger
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  disabled?: BoundValue | boolean;
}

export interface TextFieldComponent extends BaseComponent {
  type: 'TextField';
  value: BoundValue | string;
  placeholder?: BoundValue | string;
  label?: BoundValue | string;
  onChangeAction?: string;
  multiline?: boolean;
  maxLength?: number;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
  secureTextEntry?: boolean;
}

export interface CheckboxComponent extends BaseComponent {
  type: 'Checkbox';
  checked: BoundValue | boolean;
  label?: BoundValue | string;
  onChangeAction?: string;
}

export interface SliderComponent extends BaseComponent {
  type: 'Slider';
  value: BoundValue | number;
  min?: number;
  max?: number;
  step?: number;
  onChangeAction?: string;
}

export interface DateTimeInputComponent extends BaseComponent {
  type: 'DateTimeInput';
  value: BoundValue | string;
  mode?: 'date' | 'time' | 'datetime';
  onChangeAction?: string;
}

export interface MultipleChoiceComponent extends BaseComponent {
  type: 'MultipleChoice';
  options: BoundValue | Array<{ value: string; label: string }>;
  selectedValue: BoundValue | string;
  onChangeAction?: string;
}

// =============================================================================
// Modal/Container Components
// =============================================================================

export interface ModalComponent extends BaseComponent {
  type: 'Modal';
  visible: BoundValue | boolean;
  onDismissAction?: string;
}

export interface TabsComponent extends BaseComponent {
  type: 'Tabs';
  tabs: Array<{ id: string; label: string; content: string }>;
  activeTab: BoundValue | string;
  onChangeAction?: string;
}

// =============================================================================
// Union Type for All Components
// =============================================================================

export type A2UIComponent =
  | TextComponent
  | ImageComponent
  | IconComponent
  | DividerComponent
  | RowComponent
  | ColumnComponent
  | CardComponent
  | ListComponent
  | ButtonComponent
  | TextFieldComponent
  | CheckboxComponent
  | SliderComponent
  | DateTimeInputComponent
  | MultipleChoiceComponent
  | ModalComponent
  | TabsComponent;

// =============================================================================
// Action Payloads (Client → Server)
// =============================================================================

export interface ActionPayload {
  actionId: string;
  surfaceId: string;
  componentId: string;
  data?: Record<string, unknown>;
}

// =============================================================================
// Custom Component Props
// =============================================================================

export interface CustomComponentProps {
  component: A2UIComponent;
  dataModel: Record<string, unknown>;
  surfaceId: string;
  onAction?: (payload: ActionPayload) => void;
}

// =============================================================================
// A2UI Messages (JSONL Protocol)
// =============================================================================

export interface BeginRenderingMessage {
  type: 'beginRendering';
  surfaceId: string;
  rootId: string;
}

export interface SurfaceUpdateMessage {
  type: 'surfaceUpdate';
  surfaceId: string;
  components: A2UIComponent[];
}

export interface DataModelUpdateMessage {
  type: 'dataModelUpdate';
  surfaceId: string;
  path: string[];
  value: unknown;
}

export interface DeleteSurfaceMessage {
  type: 'deleteSurface';
  surfaceId: string;
}

export interface ErrorMessage {
  type: 'error';
  surfaceId?: string;
  code: string;
  message: string;
}

export type A2UIMessage =
  | BeginRenderingMessage
  | SurfaceUpdateMessage
  | DataModelUpdateMessage
  | DeleteSurfaceMessage
  | ErrorMessage;

export interface CapabilityReport {
  type: 'capabilities';
  supportedComponents: string[];
  version: string;
}

// =============================================================================
// Surface State
// =============================================================================

export interface Surface {
  id: string;
  rootId: string;
  components: Map<string, A2UIComponent>;
  dataModel: Record<string, unknown>;
}

// =============================================================================
// Renderer Props
// =============================================================================

export interface A2UIRendererProps {
  /** The A2UI specification to render */
  spec?: {
    surfaceId: string;
    rootId: string;
    components: A2UIComponent[];
    dataModel?: Record<string, unknown>;
  };

  /** Called when a user action is triggered */
  onAction?: (payload: ActionPayload) => void;

  /** Custom component overrides */
  customComponents?: Record<string, React.ComponentType<CustomComponentProps>>;

  /** Loading indicator to show while rendering */
  loadingComponent?: React.ReactNode;

  /** Error component to show on render errors */
  errorComponent?: React.ComponentType<{ error: Error }>;
}
