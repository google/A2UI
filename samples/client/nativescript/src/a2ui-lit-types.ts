/*
 * Self-contained types from @a2ui/lit/0.8 for NativeScript compatibility.
 * This avoids importing the Lit-based UI components which are web-only.
 * 
 * Copyright 2025 Google LLC - Apache License 2.0
 */

// ============ Primitives ============

export interface StringValue {
  path?: string;
  literalString?: string;
  literal?: string;
}

export interface NumberValue {
  path?: string;
  literalNumber?: number;
  literal?: number;
}

export interface BooleanValue {
  path?: string;
  literalBoolean?: boolean;
  literal?: boolean;
}

// Re-export Primitives namespace
export const Primitives = {
  StringValue: {} as StringValue,
  NumberValue: {} as NumberValue,
  BooleanValue: {} as BooleanValue,
};

export namespace Primitives {
  export type StringValue = import('./a2ui-lit-types').StringValue;
  export type NumberValue = import('./a2ui-lit-types').NumberValue;
  export type BooleanValue = import('./a2ui-lit-types').BooleanValue;
}

// ============ Components ============

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

export interface Text {
  text: StringValue;
  usageHint: "h1" | "h2" | "h3" | "h4" | "h5" | "caption" | "body";
}

export interface Image {
  url: StringValue;
  usageHint: "icon" | "avatar" | "smallFeature" | "mediumFeature" | "largeFeature" | "header";
  fit?: "contain" | "cover" | "fill" | "none" | "scale-down";
}

export interface Icon {
  name: StringValue;
}

export interface Video {
  url: StringValue;
}

export interface AudioPlayer {
  url: StringValue;
  description?: StringValue;
}

export interface Divider {
  axis?: "horizontal" | "vertical";
  color?: string;
  thickness?: number;
}

export interface Button {
  child: string;
  action: Action;
}

export interface Checkbox {
  label: StringValue;
  value: {
    path?: string;
    literalBoolean?: boolean;
  };
}

export interface TextField {
  text?: StringValue;
  label: StringValue;
  type?: "shortText" | "number" | "date" | "longText";
  validationRegexp?: string;
}

export interface DateTimeInput {
  value: StringValue;
  enableDate?: boolean;
  enableTime?: boolean;
  outputFormat?: string;
}

export interface MultipleChoice {
  selections: {
    path?: string;
    literalArray?: string[];
  };
  options?: {
    label: {
      path?: string;
      literalString?: string;
    };
    value: string;
  }[];
  maxAllowedSelections?: number;
}

export interface Slider {
  value: {
    path?: string;
    literalNumber?: number;
  };
  minValue?: number;
  maxValue?: number;
}

// ============ Types ============

export type SurfaceID = string;

export type DataValue = string | number | boolean | null | DataMap | DataObject | DataArray;
export type DataObject = { [key: string]: DataValue };
export type DataMap = Map<string, DataValue>;
export type DataArray = DataValue[];

export interface ComponentInstance {
  id: string;
  weight?: number;
  component?: { [k: string]: unknown };
}

export interface BeginRenderingMessage {
  surfaceId: string;
  root: string;
  styles?: Record<string, string>;
}

export interface SurfaceUpdateMessage {
  surfaceId: string;
  components: ComponentInstance[];
}

export interface DataModelUpdate {
  surfaceId: string;
  path?: string;
  contents: { key: string; [k: string]: unknown }[];
}

export interface DeleteSurfaceMessage {
  surfaceId: string;
}

export interface ServerToClientMessage {
  beginRendering?: BeginRenderingMessage;
  surfaceUpdate?: SurfaceUpdateMessage;
  dataModelUpdate?: DataModelUpdate;
  deleteSurface?: DeleteSurfaceMessage;
}

export interface UserAction {
  name: string;
  surfaceId: string;
  sourceComponentId: string;
  timestamp: string;
  context?: { [k: string]: unknown };
}

export interface ClientToServerMessage {
  userAction?: UserAction;
  clientUiCapabilities?: unknown;
  error?: unknown;
  request?: unknown;
}

export type A2UIClientEventMessage = ClientToServerMessage;

// Resolved types
export type ResolvedValue = string | number | boolean | null | AnyComponentNode | ResolvedMap | ResolvedArray;
export type ResolvedMap = { [key: string]: ResolvedValue };
export type ResolvedArray = ResolvedValue[];

interface BaseComponentNode {
  id: string;
  weight?: number;
  dataContextPath?: string;
  slotName?: string;
}

export type ResolvedText = Text;
export type ResolvedIcon = Icon;
export type ResolvedImage = Image;
export type ResolvedVideo = Video;
export type ResolvedAudioPlayer = AudioPlayer;
export type ResolvedDivider = Divider;
export type ResolvedCheckbox = Checkbox;
export type ResolvedTextField = TextField;
export type ResolvedDateTimeInput = DateTimeInput;
export type ResolvedMultipleChoice = MultipleChoice;
export type ResolvedSlider = Slider;

export interface ResolvedRow {
  children: AnyComponentNode[];
  distribution?: "start" | "center" | "end" | "spaceBetween" | "spaceAround" | "spaceEvenly";
  alignment?: "start" | "center" | "end" | "stretch";
}

export interface ResolvedColumn {
  children: AnyComponentNode[];
  distribution?: "start" | "center" | "end" | "spaceBetween" | "spaceAround" | "spaceEvenly";
  alignment?: "start" | "center" | "end" | "stretch";
}

export interface ResolvedButton {
  child: AnyComponentNode;
  action: Action;
}

export interface ResolvedList {
  children: AnyComponentNode[];
  direction?: "vertical" | "horizontal";
  alignment?: "start" | "center" | "end" | "stretch";
}

export interface ResolvedCard {
  child: AnyComponentNode;
  children: AnyComponentNode[];
}

export interface ResolvedTabItem {
  title: StringValue;
  child: AnyComponentNode;
}

export interface ResolvedTabs {
  tabItems: ResolvedTabItem[];
}

export interface ResolvedModal {
  entryPointChild: AnyComponentNode;
  contentChild: AnyComponentNode;
}

export interface CustomNodeProperties {
  [k: string]: ResolvedValue;
}

export interface TextNode extends BaseComponentNode {
  type: "Text";
  properties: ResolvedText;
}

export interface ImageNode extends BaseComponentNode {
  type: "Image";
  properties: ResolvedImage;
}

export interface IconNode extends BaseComponentNode {
  type: "Icon";
  properties: ResolvedIcon;
}

export interface VideoNode extends BaseComponentNode {
  type: "Video";
  properties: ResolvedVideo;
}

export interface AudioPlayerNode extends BaseComponentNode {
  type: "AudioPlayer";
  properties: ResolvedAudioPlayer;
}

export interface RowNode extends BaseComponentNode {
  type: "Row";
  properties: ResolvedRow;
}

export interface ColumnNode extends BaseComponentNode {
  type: "Column";
  properties: ResolvedColumn;
}

export interface ListNode extends BaseComponentNode {
  type: "List";
  properties: ResolvedList;
}

export interface CardNode extends BaseComponentNode {
  type: "Card";
  properties: ResolvedCard;
}

export interface TabsNode extends BaseComponentNode {
  type: "Tabs";
  properties: ResolvedTabs;
}

export interface DividerNode extends BaseComponentNode {
  type: "Divider";
  properties: ResolvedDivider;
}

export interface ModalNode extends BaseComponentNode {
  type: "Modal";
  properties: ResolvedModal;
}

export interface ButtonNode extends BaseComponentNode {
  type: "Button";
  properties: ResolvedButton;
}

export interface CheckboxNode extends BaseComponentNode {
  type: "CheckBox";
  properties: ResolvedCheckbox;
}

export interface TextFieldNode extends BaseComponentNode {
  type: "TextField";
  properties: ResolvedTextField;
}

export interface DateTimeInputNode extends BaseComponentNode {
  type: "DateTimeInput";
  properties: ResolvedDateTimeInput;
}

export interface MultipleChoiceNode extends BaseComponentNode {
  type: "MultipleChoice";
  properties: ResolvedMultipleChoice;
}

export interface SliderNode extends BaseComponentNode {
  type: "Slider";
  properties: ResolvedSlider;
}

export interface SpacerNode extends BaseComponentNode {
  type: "Spacer";
  height?: number;
  width?: number | string;
}

export interface CustomNode extends BaseComponentNode {
  type: string;
  properties: CustomNodeProperties;
}

export type AnyComponentNode =
  | TextNode
  | IconNode
  | ImageNode
  | VideoNode
  | AudioPlayerNode
  | RowNode
  | ColumnNode
  | ListNode
  | CardNode
  | TabsNode
  | DividerNode
  | ModalNode
  | ButtonNode
  | CheckboxNode
  | TextFieldNode
  | DateTimeInputNode
  | MultipleChoiceNode
  | SliderNode
  | SpacerNode
  | CustomNode;

// Generic Node type for simplified usage
export type Node = AnyComponentNode | SimpleNode;

// Simplified node type for demo/inline surfaces
export interface SimpleNode {
  type: string;
  id: string;
  children?: SimpleNode[];
  text?: string;
  textStyle?: 'title' | 'subtitle' | 'body' | 'caption' | 'code';
  title?: string;
  subtitle?: string;
  label?: string;
  variant?: 'primary' | 'secondary' | 'tertiary';
  url?: string;
  src?: string;
  fit?: 'cover' | 'contain' | 'fill';
  placeholder?: string;
  value?: string;
  helperText?: string;
  orientation?: 'horizontal' | 'vertical';
  height?: number;
  width?: number | string;
  horizontalAlignment?: 'start' | 'center' | 'end' | 'spaceBetween' | 'spaceAround';
  verticalAlignment?: 'top' | 'center' | 'bottom';
  action?: Action;
  actions?: Action[];
  items?: SimpleNode[];
  leading?: SimpleNode;
  trailing?: SimpleNode;
  child?: SimpleNode;
}

// A2UI Message types
export interface A2uiMessage {
  root?: Node | SimpleNode;
  surfaceId?: string;
  data?: Record<string, DataValue>;
}

export interface Surface {
  rootComponentId: string | null;
  componentTree: AnyComponentNode | null;
  dataModel: DataMap;
  components: Map<string, ComponentInstance>;
  styles: Record<string, string>;
}

export interface MessageProcessor {
  getSurfaces(): ReadonlyMap<string, Surface>;
  clearSurfaces(): void;
  processMessages(messages: ServerToClientMessage[]): void;
  getData(node: AnyComponentNode, relativePath: string, surfaceId: string): DataValue | null;
  setData(node: AnyComponentNode | null, relativePath: string, value: DataValue, surfaceId: string): void;
  resolvePath(path: string, dataContextPath?: string): string;
}

// Theme types (simplified)
export interface Theme {
  components: {
    AudioPlayer: Record<string, boolean>;
    Button: Record<string, boolean>;
    Card: Record<string, boolean>;
    Column: Record<string, boolean>;
    CheckBox: { container: Record<string, boolean>; element: Record<string, boolean>; label: Record<string, boolean>; };
    DateTimeInput: { container: Record<string, boolean>; element: Record<string, boolean>; label: Record<string, boolean>; };
    Divider: Record<string, boolean>;
    Image: { all: Record<string, boolean>; icon: Record<string, boolean>; avatar: Record<string, boolean>; smallFeature: Record<string, boolean>; mediumFeature: Record<string, boolean>; largeFeature: Record<string, boolean>; header: Record<string, boolean>; };
    Icon: Record<string, boolean>;
    List: Record<string, boolean>;
    Modal: { backdrop: Record<string, boolean>; element: Record<string, boolean>; };
    MultipleChoice: { container: Record<string, boolean>; element: Record<string, boolean>; label: Record<string, boolean>; };
    Row: Record<string, boolean>;
    Slider: { container: Record<string, boolean>; element: Record<string, boolean>; label: Record<string, boolean>; };
    Tabs: { container: Record<string, boolean>; controls: { all: Record<string, boolean>; selected: Record<string, boolean>; }; element: Record<string, boolean>; };
    Text: { all: Record<string, boolean>; h1: Record<string, boolean>; h2: Record<string, boolean>; h3: Record<string, boolean>; h4: Record<string, boolean>; h5: Record<string, boolean>; caption: Record<string, boolean>; body: Record<string, boolean>; };
    TextField: { container: Record<string, boolean>; element: Record<string, boolean>; label: Record<string, boolean>; };
    Video: Record<string, boolean>;
  };
  elements: {
    a: Record<string, boolean>;
    audio: Record<string, boolean>;
    body: Record<string, boolean>;
    button: Record<string, boolean>;
    h1: Record<string, boolean>;
    h2: Record<string, boolean>;
    h3: Record<string, boolean>;
    h4: Record<string, boolean>;
    h5: Record<string, boolean>;
    iframe: Record<string, boolean>;
    input: Record<string, boolean>;
    p: Record<string, boolean>;
    pre: Record<string, boolean>;
    textarea: Record<string, boolean>;
    video: Record<string, boolean>;
  };
  markdown: {
    p: string[];
    h1: string[];
    h2: string[];
    h3: string[];
    h4: string[];
    h5: string[];
    ul: string[];
    ol: string[];
    li: string[];
    a: string[];
    strong: string[];
    em: string[];
  };
  additionalStyles?: Record<string, Record<string, string>>;
}

// Re-export Types namespace for compatibility
export namespace Types {
  export type StringValue = import('./a2ui-lit-types').StringValue;
  export type NumberValue = import('./a2ui-lit-types').NumberValue;
  export type BooleanValue = import('./a2ui-lit-types').BooleanValue;
  export type Action = import('./a2ui-lit-types').Action;
  export type Text = import('./a2ui-lit-types').Text;
  export type Image = import('./a2ui-lit-types').Image;
  export type Icon = import('./a2ui-lit-types').Icon;
  export type Video = import('./a2ui-lit-types').Video;
  export type AudioPlayer = import('./a2ui-lit-types').AudioPlayer;
  export type Divider = import('./a2ui-lit-types').Divider;
  export type Button = import('./a2ui-lit-types').Button;
  export type Checkbox = import('./a2ui-lit-types').Checkbox;
  export type TextField = import('./a2ui-lit-types').TextField;
  export type DateTimeInput = import('./a2ui-lit-types').DateTimeInput;
  export type MultipleChoice = import('./a2ui-lit-types').MultipleChoice;
  export type Slider = import('./a2ui-lit-types').Slider;
  export type SurfaceID = import('./a2ui-lit-types').SurfaceID;
  export type DataValue = import('./a2ui-lit-types').DataValue;
  export type DataObject = import('./a2ui-lit-types').DataObject;
  export type DataMap = import('./a2ui-lit-types').DataMap;
  export type DataArray = import('./a2ui-lit-types').DataArray;
  export type ServerToClientMessage = import('./a2ui-lit-types').ServerToClientMessage;
  export type A2UIClientEventMessage = import('./a2ui-lit-types').A2UIClientEventMessage;
  export type AnyComponentNode = import('./a2ui-lit-types').AnyComponentNode;
  export type Node = import('./a2ui-lit-types').Node;
  export type SimpleNode = import('./a2ui-lit-types').SimpleNode;
  export type A2uiMessage = import('./a2ui-lit-types').A2uiMessage;
  export type TextNode = import('./a2ui-lit-types').TextNode;
  export type ImageNode = import('./a2ui-lit-types').ImageNode;
  export type IconNode = import('./a2ui-lit-types').IconNode;
  export type VideoNode = import('./a2ui-lit-types').VideoNode;
  export type AudioPlayerNode = import('./a2ui-lit-types').AudioPlayerNode;
  export type RowNode = import('./a2ui-lit-types').RowNode;
  export type ColumnNode = import('./a2ui-lit-types').ColumnNode;
  export type ListNode = import('./a2ui-lit-types').ListNode;
  export type CardNode = import('./a2ui-lit-types').CardNode;
  export type TabsNode = import('./a2ui-lit-types').TabsNode;
  export type DividerNode = import('./a2ui-lit-types').DividerNode;
  export type ModalNode = import('./a2ui-lit-types').ModalNode;
  export type ButtonNode = import('./a2ui-lit-types').ButtonNode;
  export type CheckboxNode = import('./a2ui-lit-types').CheckboxNode;
  export type TextFieldNode = import('./a2ui-lit-types').TextFieldNode;
  export type DateTimeInputNode = import('./a2ui-lit-types').DateTimeInputNode;
  export type MultipleChoiceNode = import('./a2ui-lit-types').MultipleChoiceNode;
  export type SliderNode = import('./a2ui-lit-types').SliderNode;
  export type SpacerNode = import('./a2ui-lit-types').SpacerNode;
  export type CustomNode = import('./a2ui-lit-types').CustomNode;
  export type Surface = import('./a2ui-lit-types').Surface;
  export type MessageProcessor = import('./a2ui-lit-types').MessageProcessor;
  export type Theme = import('./a2ui-lit-types').Theme;
  export type ResolvedText = import('./a2ui-lit-types').ResolvedText;
  export type ResolvedIcon = import('./a2ui-lit-types').ResolvedIcon;
  export type ResolvedImage = import('./a2ui-lit-types').ResolvedImage;
  export type ResolvedVideo = import('./a2ui-lit-types').ResolvedVideo;
  export type ResolvedAudioPlayer = import('./a2ui-lit-types').ResolvedAudioPlayer;
  export type ResolvedDivider = import('./a2ui-lit-types').ResolvedDivider;
  export type ResolvedCheckbox = import('./a2ui-lit-types').ResolvedCheckbox;
  export type ResolvedTextField = import('./a2ui-lit-types').ResolvedTextField;
  export type ResolvedDateTimeInput = import('./a2ui-lit-types').ResolvedDateTimeInput;
  export type ResolvedMultipleChoice = import('./a2ui-lit-types').ResolvedMultipleChoice;
  export type ResolvedSlider = import('./a2ui-lit-types').ResolvedSlider;
  export type ResolvedButton = import('./a2ui-lit-types').ResolvedButton;
  export type ResolvedRow = import('./a2ui-lit-types').ResolvedRow;
  export type ResolvedColumn = import('./a2ui-lit-types').ResolvedColumn;
  export type ResolvedList = import('./a2ui-lit-types').ResolvedList;
  export type ResolvedCard = import('./a2ui-lit-types').ResolvedCard;
  export type ResolvedTabs = import('./a2ui-lit-types').ResolvedTabs;
  export type ResolvedModal = import('./a2ui-lit-types').ResolvedModal;
}
