/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Action {
  /**
   * A unique name identifying the action (e.g., 'submitForm').
   */
  action: string;
  /**
   * A key-value map of data bindings to be resolved when the action is triggered.
   */
  context?: {
    key: string;
    /**
     * The dynamic value. Define EXACTLY ONE of the nested properties.
     */
    value: {
      /**
       * A data binding reference to a location in the data model (e.g., '/user/name').
       */
      path?: string;
      /**
       * A fixed, hardcoded string value.
       */
      literalString?: string;
      literalNumber?: number;
      literalBoolean?: boolean;
    };
  }[];
}

export type ComponentType = keyof Component["componentProperties"];

export interface ComponentRef {
  /**
   * An explicit list of component instance IDs.
   */
  explicitList?: string[];
  /**
   * A template to be rendered for each item in a data-bound list.
   */
  template?: {
    /**
     * The ID of the component (from the main 'components' list) to use as a template for each item.
     */
    componentId: string;
    /**
     * A data binding reference to a list within the data model (e.g., '/user/posts').
     */
    dataBinding: string;
  };
}

export interface StringValue {
  /**
   * A data binding reference to a location in the data model (e.g., '/user/name').
   */
  path?: string;
  /**
   * A fixed, hardcoded string value.
   */
  literalString?: string;
}

export interface NumberValue {
  /**
   * A data binding reference to a location in the data model (e.g., '/user/name').
   */
  path?: string;
  /**
   * A fixed, hardcoded number value.
   */
  literalNumber?: number;
}

export interface BooleanValue {
  /**
   * A data binding reference to a location in the data model (e.g., '/user/name').
   */
  path?: string;
  /**
   * A fixed, hardcoded boolean value.
   */
  literalBoolean?: boolean;
}

export interface Heading {
  text: StringValue;
  /**
   * The semantic importance level.
   */
  level?: "1" | "2" | "3" | "4" | "5";
}

export interface Text {
  text: StringValue;
}

export interface Image {
  url: StringValue;
}

export interface Video {
  url: StringValue;
}

export interface AudioPlayer {
  url: StringValue;
  /**
   * A label, title, or placeholder text.
   */
  description?: StringValue;
}

export interface Row {
  /**
   * Defines the children of the container. You MUST define EITHER 'explicitList' OR 'template', but not both.
   */
  children: ComponentRef | Component[];
  /**
   * Distribution of items along the main axis.
   */
  distribution?:
    | "start"
    | "center"
    | "end"
    | "spaceBetween"
    | "spaceAround"
    | "spaceEvenly";
  /**
   * Alignment of items/child along the cross axis.
   */
  alignment?: "start" | "center" | "end" | "stretch";
}

export interface Column {
  /**
   * Defines the children of the container. You MUST define EITHER 'explicitList' OR 'template', but not both.
   */
  children: ComponentRef | Component[];
  /**
   * Distribution of items along the main axis.
   */
  distribution?:
    | "start"
    | "center"
    | "end"
    | "spaceBetween"
    | "spaceAround"
    | "spaceEvenly";
  /**
   * Alignment of items/child along the cross axis.
   */
  alignment?: "start" | "center" | "end" | "stretch";
}

export interface List {
  /**
   * Defines the children of the container. You MUST define EITHER 'explicitList' OR 'template', but not both.
   */
  children: ComponentRef | Component[];
  /**
   * The direction of the list.
   */
  direction?: "vertical" | "horizontal";
  /**
   * Alignment of items/child along the cross axis.
   */
  alignment?: "start" | "center" | "end" | "stretch";
}

export interface Card {
  /**
   * A reference to a single component instance by its unique ID.
   */
  child: string;
  children: Component[];
}

export interface Tabs {
  /**
   * A list of tabs, each with a title and a child component ID.
   */
  tabItems: {
    /**
     * The title of the tab.
     */
    title: {
      /**
       * A data binding reference to a location in the data model (e.g., '/user/name').
       */
      path?: string;
      /**
       * A fixed, hardcoded string value.
       */
      literalString?: string;
    };
    /**
     * A reference to a component instance by its unique ID.
     */
    child: string;
  }[];
}

export interface Divider {
  /**
   * The orientation.
   */
  axis?: "horizontal" | "vertical";
  /**
   * The color of the divider (e.g., hex code or semantic name).
   */
  color?: string;
  /**
   * The thickness of the divider.
   */
  thickness?: number;
}

export interface Modal {
  /**
   * The ID of the component (e.g., a button) that triggers the modal.
   */
  entryPointChild: string;
  /**
   * The ID of the component to display as the modal's content.
   */
  contentChild: string;
}

export interface Button {
  label: StringValue;
  /**
   * Represents a user-initiated action.
   */
  action: Action;
}

export interface Checkbox {
  label: StringValue;
  value: {
    /**
     * A data binding reference to a location in the data model (e.g., '/user/name').
     */
    path?: string;
    literalBoolean?: boolean;
  };
}

export interface TextField {
  text?: StringValue;
  /**
   * A label, title, or placeholder text.
   */
  label: StringValue;
  type?: "shortText" | "number" | "date" | "longText";
  /**
   * A regex string to validate the input.
   */
  validationRegexp?: string;
}

export interface DateTimeInput {
  value: StringValue;
  enableDate?: boolean;
  enableTime?: boolean;
  /**
   * The string format for the output (e.g., 'YYYY-MM-DD').
   */
  outputFormat?: string;
}

export interface MultipleChoice {
  selections: {
    /**
     * A data binding reference to a location in the data model (e.g., '/user/name').
     */
    path?: string;
    literalArray?: string[];
  };
  options?: {
    label: {
      /**
       * A data binding reference to a location in the data model (e.g., '/user/name').
       */
      path?: string;
      /**
       * A fixed, hardcoded string value.
       */
      literalString?: string;
    };
    value: string;
  }[];
  maxAllowedSelections?: number;
}

export interface Slider {
  value: {
    /**
     * A data binding reference to a location in the data model (e.g., '/user/name').
     */
    path?: string;
    literalNumber?: number;
  };
  minValue?: number;
  maxValue?: number;
}

export interface Component {
  /**
   * A unique identifier for this component instance. This property is REQUIRED.
   */
  id: string;
  /**
   * The data prefix to use when requesting data for this item.
   */
  dataPrefix?: string;
  /**
   * The data prefix to use when requesting data for this item.
   */
  weight?: number;
  /**
   * Defines the properties for a specific component type. Exactly ONE of the properties in this object must be set.
   */
  componentProperties: {
    /**
     * These have children.
     */
    Row?: Row;
    Column?: Column;
    List?: List;

    /**
     * This has a child.
     */
    Card?: Card;

    /**
     * These are leaves.
     */
    AudioPlayer?: AudioPlayer;
    Button?: Button;
    CheckBox?: Checkbox;
    DateTimeInput?: DateTimeInput;
    Divider?: Divider;
    Heading?: Heading;
    Image?: Image;
    Modal?: Modal;
    MultipleChoice?: MultipleChoice;
    Slider?: Slider;
    Tabs?: Tabs;
    Text?: Text;
    TextField?: TextField;
    Video?: Video;
  };
}

/**
 * A schema for a ComponentUpdate message in the A2A streaming UI protocol.
 */
export interface ComponentUpdateMessage {
  /**
   * A flat list of all component instances available for rendering. Components reference each other by ID. This property is REQUIRED.
   */
  components: Component[];
}
