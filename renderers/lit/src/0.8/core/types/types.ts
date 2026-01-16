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

import { StringValue, NumberValue, BooleanValue } from "./primitives.js";
export {
  type ClientToServerMessage as A2UIClientEventMessage,
  type ClientCapabilitiesDynamic,
  type UserAction,
} from "./client-event.js";

// --- Core Action Type ---

export interface Action {
  /**
   * A unique name identifying the action (e.g., 'submitForm').
   */
  name: string;
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

// --- Core Node Types ---

// Base interface for any resolved component node.
export interface BaseResolvedNode<TName extends string = string> {
  id: string;
  type: TName;
  weight: number | 'initial';
  dataContextPath?: string;
  slotName?: string;
}

// Union type for any possible resolved node.
// Now strictly generic to decouple from specific components.
export type AnyResolvedNode = BaseResolvedNode<string> & {
  properties: Record<string, unknown>;
};

// Interface for a component's definition.
export interface ComponentApi<
  TName extends string,
  RNode extends BaseResolvedNode<TName>
> {
  readonly name: TName;

  /**
   * Resolves the raw properties from the A2UI message into the typed
   * properties required by the final resolved node. This logic is specific
   * to each component.
   * @param unresolvedProperties The raw properties from the message.
   * @param resolver A callback provided by the A2uiMessageProcessor to recursively
   *        resolve values (e.g., data bindings, child component IDs).
   * @returns The resolved properties for the node.
   */
  resolveProperties(
    unresolvedProperties: Record<string, unknown>,
    resolver: (value: unknown) => unknown
  ): Omit<RNode, keyof BaseResolvedNode<TName>>;
}

export type AnyComponentApi = ComponentApi<string, any>;

export class CatalogApi {
  private readonly components: Map<string, AnyComponentApi>;

  constructor(components: AnyComponentApi[]) {
    this.components = new Map(components.map(c => [c.name, c]));
  }

  public get(componentName: string): AnyComponentApi | undefined {
    return this.components.get(componentName);
  }
}

/**
 * @template RNode The specific resolved node type this component can render.
 * @template RenderOutput The output type of the rendering framework (e.g., TemplateResult for Lit, JSX.Element for React).
 */
export interface ComponentRenderer<
  RNode extends AnyResolvedNode,
  RenderOutput
> {
  readonly componentName: RNode['type'];

  /**
   * Renders the resolved component node.
   * @param node The fully resolved, typed component node to render.
   * @param renderChild A function provided by the framework renderer to
   *        recursively render child nodes. Container components MUST use this.
   * @returns The framework-specific, renderable output.
   */
  render(
    node: RNode,
    renderChild: (child: AnyResolvedNode) => RenderOutput | null
  ): RenderOutput;
}
export type AnyComponentRenderer<RenderOutput> = ComponentRenderer<any, RenderOutput>;

export class CatalogImplementation<RenderOutput> {
  private readonly renderers: Map<string, AnyComponentRenderer<RenderOutput>>;

  /**
   * @param catalogApi The API definition for the catalog.
   * @param renderers A list of framework-specific renderers.
   */
  constructor(catalogApi: CatalogApi, renderers: AnyComponentRenderer<RenderOutput>[]) {
    this.renderers = new Map(renderers.map(r => [r.componentName, r]));

    for (const api of (catalogApi as any)['components'].values()) {
        if (!this.renderers.has(api.name)) {
            throw new Error(`Missing renderer implementation for component: ${api.name}`);
        }
    }
  }

  public getRenderer(componentName: string): AnyComponentRenderer<RenderOutput> | undefined {
    return this.renderers.get(componentName);
  }
}

export class FrameworkRenderer<RenderOutput> {
  protected readonly catalogImplementation: CatalogImplementation<RenderOutput>;

  constructor(catalogImplementation: CatalogImplementation<RenderOutput>) {
    this.catalogImplementation = catalogImplementation;
  }

  /**
   * Renders a resolved node from the A2uiMessageProcessor into the final output.
   * This is the entry point for rendering a component tree.
   */
  public renderNode(node: AnyResolvedNode): RenderOutput | null {
    const renderer = this.catalogImplementation.getRenderer(node.type);
    if (!renderer) {
      console.warn(`No renderer found for component type: ${node.type}`);
      return null;
    }

    // The `renderChild` function passed to the component renderer is a bound
    // version of this same `renderNode` method, enabling recursion.
    return renderer.render(node, this.renderNode.bind(this));
  }
}


export type MessageProcessor = {
  getSurfaces(): ReadonlyMap<string, Surface>;
  clearSurfaces(): void;
  processMessages(messages: ServerToClientMessage[]): void;

  /**
   * Retrieves the data for a given component node and a relative path string.
   * This correctly handles the special `.` path, which refers to the node's
   * own data context.
   */
  getData(
    node: AnyResolvedNode,
    relativePath: string,
    surfaceId: string
  ): DataValue | null;

  setData(
    node: AnyResolvedNode | null,
    relativePath: string,
    value: DataValue,
    surfaceId: string
  ): void;

  resolvePath(path: string, dataContextPath?: string): string;
};

export type Theme = {
  components: {
    AudioPlayer: Record<string, boolean>;
    Button: Record<string, boolean>;
    Card: Record<string, boolean>;
    Column: Record<string, boolean>;
    CheckBox: {
      container: Record<string, boolean>;
      element: Record<string, boolean>;
      label: Record<string, boolean>;
    };
    DateTimeInput: {
      container: Record<string, boolean>;
      element: Record<string, boolean>;
      label: Record<string, boolean>;
    };
    Divider: Record<string, boolean>;
    Image: {
      all: Record<string, boolean>;
      icon: Record<string, boolean>;
      avatar: Record<string, boolean>;
      smallFeature: Record<string, boolean>;
      mediumFeature: Record<string, boolean>;
      largeFeature: Record<string, boolean>;
      header: Record<string, boolean>;
    };
    Icon: Record<string, boolean>;
    List: Record<string, boolean>;
    Modal: {
      backdrop: Record<string, boolean>;
      element: Record<string, boolean>;
    };
    MultipleChoice: {
      container: Record<string, boolean>;
      element: Record<string, boolean>;
      label: Record<string, boolean>;
    };
    Row: Record<string, boolean>;
    Slider: {
      container: Record<string, boolean>;
      element: Record<string, boolean>;
      label: Record<string, boolean>;
    };
    Tabs: {
      container: Record<string, boolean>;
      element: Record<string, boolean>;
      controls: {
        all: Record<string, boolean>;
        selected: Record<string, boolean>;
      };
    };
    Text: {
      all: Record<string, boolean>;
      h1: Record<string, boolean>;
      h2: Record<string, boolean>;
      h3: Record<string, boolean>;
      h4: Record<string, boolean>;
      h5: Record<string, boolean>;
      caption: Record<string, boolean>;
      body: Record<string, boolean>;
    };
    TextField: {
      container: Record<string, boolean>;
      element: Record<string, boolean>;
      label: Record<string, boolean>;
    };
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
  additionalStyles?: {
    AudioPlayer?: Record<string, string>;
    Button?: Record<string, string>;
    Card?: Record<string, string>;
    Column?: Record<string, string>;
    CheckBox?: Record<string, string>;
    DateTimeInput?: Record<string, string>;
    Divider?: Record<string, string>;
    Heading?: Record<string, string>;
    Icon?: Record<string, string>;
    Image?: Record<string, string>;
    List?: Record<string, string>;
    Modal?: Record<string, string>;
    MultipleChoice?: Record<string, string>;
    Row?: Record<string, string>;
    Slider?: Record<string, string>;
    Tabs?: Record<string, string>;
    Text?:
      | Record<string, string>
      | {
          h1: Record<string, string>;
          h2: Record<string, string>;
          h3: Record<string, string>;
          h4: Record<string, string>;
          h5: Record<string, string>;
          body: Record<string, string>;
          caption: Record<string, string>;
        };
    TextField?: Record<string, string>;
    Video?: Record<string, string>;
  };
};

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
  weight?: number;
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
  contents: ValueMap[];
}

// ValueMap is a type of DataObject for passing to the data model.
export type ValueMap = DataObject & {
  key: string;
  /** May be JSON */
  valueString?: string;
  valueNumber?: number;
  valueBoolean?: boolean;
  valueMap?: ValueMap[];
};

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
  | AnyResolvedNode
  | ResolvedMap
  | ResolvedArray;

/** A generic map where each value has been recursively resolved. */
export type ResolvedMap = { [key: string]: ResolvedValue };

/** A generic array where each item has been recursively resolved. */
export type ResolvedArray = ResolvedValue[];

export interface CustomNode extends BaseResolvedNode {
  type: string;
  // For custom nodes, properties are just a map of string keys to any resolved value.
  properties: CustomNodeProperties;
}

export type AnyComponentNode = AnyResolvedNode;

export interface CustomNodeProperties {
  [k: string]: ResolvedValue;
}

export type SurfaceID = string;

/** The complete state of a single UI surface. */
export interface Surface {
  rootComponentId: string | null;
  componentTree: AnyResolvedNode | null;
  dataModel: DataMap;
  components: Map<string, ComponentInstance>;
  styles: Record<string, string>;
}