/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

export {
  type ClientToServerMessage as A2UIClientEventMessage,
  type ClientCapabilitiesDynamic,
} from "./client-event.js";
export { type Action } from "./components.js";

import {
  Heading,
  Text,
  Image,
  Video,
  AudioPlayer,
  Divider,
  Button,
  Checkbox,
  TextField,
  DateTimeInput,
  MultipleChoice,
  Slider,
} from "./components";
import { StringValue } from "./primitives";

export type Theme = {
  components: {
    AudioPlayer: Record<string, boolean | string>;
    Button: Record<string, boolean | string>;
    Card: Record<string, boolean | string>;
    Column: Record<string, boolean | string>;
    CheckBox: {
      container: Record<string, boolean | string>;
      element: Record<string, boolean | string>;
      label: Record<string, boolean | string>;
    };
    DateTimeInput: Record<string, boolean | string>;
    Divider: Record<string, boolean | string>;
    Heading: Record<string, boolean | string>;
    Image: Record<string, boolean | string>;
    List: Record<string, boolean | string>;
    Modal: Record<string, boolean | string>;
    MultipleChoice: Record<string, boolean | string>;
    Row: Record<string, boolean | string>;
    Slider: Record<string, boolean | string>;
    Tabs: {
      container: Record<string, boolean | string>;
      element: Record<string, boolean | string>;
      controls: {
        all: Record<string, boolean>;
        selected: Record<string, boolean>;
      };
    };
    Text: Record<string, boolean | string>;
    TextField: Record<string, boolean | string>;
    Video: Record<string, boolean | string>;
  };
  elements: {
    a: Record<string, boolean>;
    audio: Record<string, boolean>;
    body: Record<string, boolean>;
    button: Record<string, boolean>;
    h1: Record<string, boolean>;
    h2: Record<string, boolean>;
    h3: Record<string, boolean>;
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
    h6: string[];
    ul: string[];
    ol: string[];
    li: string[];
    a: string[];
    strong: string[];
    em: string[];
  };
  additionalStyles?: {
    AudioPlayer?: Record<string, string>;
    Button?: Record<string, string>;
    Card?: Record<string, string>;
    Column?: Record<string, string>;
    CheckBox?: Record<string, string>;
    DateTimeInput?: Record<string, string>;
    Divider?: Record<string, string>;
    Heading?: Record<string, string>;
    Image?: Record<string, string>;
    List?: Record<string, string>;
    Modal?: Record<string, string>;
    MultipleChoice?: Record<string, string>;
    Row?: Record<string, string>;
    Slider?: Record<string, string>;
    Tabs?: Record<string, string>;
    Text?: Record<string, string>;
    TextField?: Record<string, string>;
    Video?: Record<string, string>;
  };
};

/**
 * Represents a user-initiated action, sent from the client to the server.
 */
export interface UserAction {
  /**
   * The name of the action, taken from the component's `action.action`
   * property.
   */
  actionName: string;
  /**
   * The `id` of the component that triggered the event.
   */
  sourceComponentId: string;
  /**
   * An ISO 8601 timestamp of when the event occurred.
   */
  timestamp: string;
  /**
   * A JSON object containing the key-value pairs from the component's
   * `action.context`, after resolving all data bindings.
   */
  context?: {
    [k: string]: unknown;
  };
}

/** A recursive type for any valid JSON-like value in the data model. */
export type DataValue =
  | string
  | number
  | boolean
  | null
  | DataMap
  | DataObject
  | DataArray;
export type DataObject = { [key: string]: DataValue };
export type DataMap = Map<string, DataValue>;
export type DataArray = DataValue[];

/** A template for creating components from a list in the data model. */
export interface ComponentArrayTemplate {
  componentId: string;
  dataBinding: string;
}

/** Defines a list of child components, either explicitly or via a template. */
export interface ComponentArrayReference {
  explicitList?: string[];
  template?: ComponentArrayTemplate;
}

/** Represents the general shape of a component's properties. */
export type ComponentProperties = {
  // Allow any property, but define known structural ones for type safety.
  children?: ComponentArrayReference;
  child?: string;
  [k: string]: unknown;
};

/** A raw component instance from a SurfaceUpdate message. */
export interface ComponentInstance {
  id: string;
  componentProperties?: ComponentProperties;
  component?: ComponentProperties;
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
  contents: {
    key: string;
    valueString?: string /** May be JSON */;
    valueNumber?: number;
    valueBoolean?: boolean;

    valueList?: {
      valueString?: string /** May be JSON */;
      valueNumber?: number;
      valueBoolean?: boolean;
    }[];
  }[];
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

/**
 * A recursive type for any value that can appear within a resolved component
 * tree. This is the main type that makes the recursive resolution possible.
 */
export type ResolvedValue =
  | string
  | number
  | boolean
  | null
  | AnyComponentNode
  | ResolvedMap
  | ResolvedArray;

/** A generic map where each value has been recursively resolved. */
export type ResolvedMap = { [key: string]: ResolvedValue };

/** A generic array where each item has been recursively resolved. */
export type ResolvedArray = ResolvedValue[];

/**
 * A base interface that all component nodes share.
 */
interface BaseComponentNode {
  id: string;
  dataContextPath?: string;
}

export interface HeadingNode extends BaseComponentNode {
  type: "Heading";
  properties: ResolvedHeading;
}

export interface TextNode extends BaseComponentNode {
  type: "Text";
  properties: ResolvedText;
}

export interface ImageNode extends BaseComponentNode {
  type: "Image";
  properties: ResolvedImage;
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

/**
 * The complete discriminated union of all possible resolved component nodes.
 * A renderer would use this type for any given node in the component tree.
 */
export type AnyComponentNode =
  | HeadingNode
  | TextNode
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
  | SliderNode;

// These components do not contain other components can reuse their
// original interfaces.
export type ResolvedHeading = Heading;
export type ResolvedText = Text;
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
  distribution?:
    | "start"
    | "center"
    | "end"
    | "spaceBetween"
    | "spaceAround"
    | "spaceEvenly";
  alignment?: "start" | "center" | "end" | "stretch";
}

export interface ResolvedColumn {
  children: AnyComponentNode[];
  distribution?:
    | "start"
    | "center"
    | "end"
    | "spaceBetween"
    | "spaceAround"
    | "spaceEvenly";
  alignment?: "start" | "center" | "end" | "stretch";
}

export interface ResolvedButton {
  child: AnyComponentNode;
  action: Button["action"];
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

export type SurfaceID = string;

/** The complete state of a single UI surface. */
export interface Surface {
  rootComponentId: string | null;
  componentTree: AnyComponentNode | null;
  dataModel: DataMap;
  components: Map<string, ComponentInstance>;
  styles: Record<string, string>;
}
