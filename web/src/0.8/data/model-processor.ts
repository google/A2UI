/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { SignalMap } from "signal-utils/map";
import {
  A2UIProtocolMessage,
  AnyComponentNode,
  BeginRenderingMessage,
  DataArray,
  DataMap,
  DataModelUpdate,
  DataValue,
  DeleteSurfaceMessage,
  ResolvedMap,
  ResolvedValue,
  Surface,
  SurfaceID,
  SurfaceUpdateMessage,
} from "../types/types";
import { SignalSet } from "signal-utils/set";
import { SignalObject } from "signal-utils/object";
import { SignalArray } from "signal-utils/array";
import {
  isComponentArrayReference,
  isObject,
  isPath,
  isResolvedAudioPlayer,
  isResolvedButton,
  isResolvedCard,
  isResolvedCheckbox,
  isResolvedColumn,
  isResolvedDateTimeInput,
  isResolvedDivider,
  isResolvedHeading,
  isResolvedImage,
  isResolvedList,
  isResolvedModal,
  isResolvedMultipleChoice,
  isResolvedRow,
  isResolvedSlider,
  isResolvedTabs,
  isResolvedText,
  isResolvedTextField,
  isResolvedVideo,
} from "./guards.js";
import { deep } from "signal-utils/deep";

/**
 * Processes and consolidates A2UIProtocolMessage objects into a
 * structured, hierarchical model of UI surfaces.
 */
export class A2UIModelProcessor {
  static readonly DEFAULT_SURFACE_ID = "@default";

  #currentSurface = A2UIModelProcessor.DEFAULT_SURFACE_ID;
  #surfaces: Map<SurfaceID, Surface> = new SignalMap() as unknown as Map<
    SurfaceID,
    Surface
  >;
  #styles: Record<string, unknown> = {};

  getSurfaces(): ReadonlyMap<string, Surface> {
    return this.#surfaces;
  }

  getStyles(): Readonly<Record<string, unknown>> {
    return this.#styles;
  }

  clearSurfaces() {
    this.#surfaces.clear();
  }

  processMessages(messages: A2UIProtocolMessage[]): void {
    for (const message of messages) {
      if (message.surfaceId) {
        this.#currentSurface = message.surfaceId;
      }

      if (message.beginRendering) {
        this.#handleBeginRendering(
          message.beginRendering,
          this.#currentSurface ?? A2UIModelProcessor.DEFAULT_SURFACE_ID
        );
      } else if (message.surfaceUpdate) {
        this.#handleSurfaceUpdate(
          message.surfaceUpdate,
          this.#currentSurface ?? A2UIModelProcessor.DEFAULT_SURFACE_ID
        );
      } else if (message.dataModelUpdate) {
        this.#handleDataModelUpdate(
          message.dataModelUpdate,
          this.#currentSurface ?? A2UIModelProcessor.DEFAULT_SURFACE_ID
        );
      } else if (message.deleteSurface) {
        this.#handleDeleteSurface(message.deleteSurface);
      }
    }
  }

  getDataByPath(path: string, surfaceId: SurfaceID | null = null) {
    if (!surfaceId) {
      surfaceId = A2UIModelProcessor.DEFAULT_SURFACE_ID;
    }
    const surface = this.#getOrCreateSurface(surfaceId);
    if (!surface) {
      return null;
    }

    return this.#getDataByPath(surface.dataModel, path) ?? null;
  }

  setDataByPath(
    path: string,
    value: DataValue,
    surfaceId = A2UIModelProcessor.DEFAULT_SURFACE_ID
  ) {
    const surface = this.#getOrCreateSurface(surfaceId);
    if (!surface) {
      return null;
    }

    return this.#setDataByPath(surface.dataModel, path, value);
  }

  resolvePath(path: string, dataContextPath?: string) {
    if (dataContextPath) {
      if (path.startsWith("/") || dataContextPath.endsWith("/")) {
        return `${dataContextPath}${path}`;
      } else {
        return `${dataContextPath}/${path}`;
      }
    }

    return path;
  }

  #setDataByPath(root: DataMap, path: string, value: DataValue): void {
    const segments = path.split("/").filter((s) => s);
    if (segments.length === 0) {
      // Root data can either be a Map or an Object. If we receive an Object,
      // however, we will normalize it to a proper Map.
      if (value instanceof Map || isObject(value)) {
        // Normalize an Object to a Map.
        if (isObject(value)) {
          value = new Map(Object.entries(value));
        }

        root.clear();
        for (const [key, v] of value.entries()) {
          root.set(key, v);
        }
      } else {
        console.error("Cannot set root of DataModel to a non-Map value.");
      }
      return;
    }

    let current: DataMap | DataArray = root;
    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i];
      let target: DataValue | undefined;

      if (current instanceof Map) {
        target = current.get(segment);
      } else if (Array.isArray(current) && /^\d+$/.test(segment)) {
        target = current[parseInt(segment, 10)];
      }

      if (
        target === undefined ||
        typeof target !== "object" ||
        target === null
      ) {
        const targetIsArray = /^\d+$/.test(segments[i + 1]);
        target = (
          targetIsArray ? new SignalArray() : new SignalMap()
        ) as DataValue;
        if (current instanceof Map) {
          current.set(segment, target);
        } else if (Array.isArray(current)) {
          current[parseInt(segment, 10)] = target;
        }
      }
      current = target as DataMap | DataArray;
    }

    const finalSegment = segments[segments.length - 1];
    const storedValue = deep(value);
    if (current instanceof Map) {
      current.set(finalSegment, storedValue);
    } else if (Array.isArray(current) && /^\d+$/.test(finalSegment)) {
      current[parseInt(finalSegment, 10)] = storedValue;
    }
  }

  #getDataByPath(root: DataMap, path: string): DataValue | null {
    const segments = path.split("/").filter((s) => s);
    let current: DataValue = root;
    for (const segment of segments) {
      if (current === undefined) return null;

      if (current instanceof Map) {
        current = current.get(segment) as DataMap;
      } else if (Array.isArray(current) && /^\d+$/.test(segment)) {
        current = current[parseInt(segment, 10)];
      } else if (isObject(current)) {
        return current[segment];
      } else {
        return null;
      }
    }
    return current;
  }

  #getOrCreateSurface(surfaceId: string): Surface {
    let surface: Surface | undefined = this.#surfaces.get(surfaceId);
    if (!surface) {
      surface = new SignalObject({
        rootComponentId: null,
        componentTree: null,
        dataModel: new SignalMap(),
        components: new SignalMap(),
      }) as unknown as Surface;

      this.#surfaces.set(surfaceId, surface);
    }

    return surface;
  }

  #handleBeginRendering(
    message: BeginRenderingMessage,
    surfaceId: SurfaceID
  ): void {
    const surface = this.#getOrCreateSurface(surfaceId);
    surface.rootComponentId = message.root;
    this.#styles = message.styles ?? {};
    this.#rebuildComponentTree(surface);
  }

  #handleSurfaceUpdate(
    message: SurfaceUpdateMessage,
    surfaceId: SurfaceID
  ): void {
    const surface = this.#getOrCreateSurface(surfaceId);
    for (const component of message.components) {
      surface.components.set(component.id, component);
    }
    this.#rebuildComponentTree(surface);
  }

  #handleDataModelUpdate(message: DataModelUpdate, surfaceId: SurfaceID): void {
    const surface = this.#getOrCreateSurface(surfaceId);
    const path = message.path ?? "/";
    this.#setDataByPath(surface.dataModel, path, message.contents);
    this.#rebuildComponentTree(surface);
  }

  #handleDeleteSurface(message: DeleteSurfaceMessage): void {
    this.#surfaces.delete(message.surfaceId);
  }

  /**
   * Starts at the root component of the surface and builds out the tree
   * recursively. This process involves resolving all properties of the child
   * components, and expanding on any explicit children lists or templates
   * found in the structure.
   *
   * @param surface The surface to be built.
   */
  #rebuildComponentTree(surface: Surface): void {
    if (!surface.rootComponentId) {
      surface.componentTree = null;
      return;
    }

    // Track visited nodes to avoid circular references.
    const visited = new SignalSet<string>() as unknown as Set<string>;
    surface.componentTree = this.#buildNodeRecursive(
      surface.rootComponentId,
      surface,
      visited,
      "/"
    );
  }

  /**
   * Builds out the nodes recursively.
   */
  #buildNodeRecursive(
    componentId: string,
    surface: Surface,
    visited: Set<string>,
    dataContextPath: string
  ): AnyComponentNode | null {
    const baseComponentId = componentId.split(":").at(0) ?? "";
    const { components } = surface;

    if (!components.has(baseComponentId)) {
      return null;
    }

    if (visited.has(componentId)) {
      throw new Error(`Circular dependency for component "${componentId}".`);
    }

    visited.add(componentId);

    const componentData = components.get(baseComponentId)!;
    const componentType = Object.keys(componentData.componentProperties)[0];
    const unresolvedProperties =
      componentData.componentProperties[
        componentType as keyof typeof componentData.componentProperties
      ];

    // Manually build the resolvedProperties object by resolving each value in
    // the component's properties.
    const resolvedProperties: ResolvedMap = new SignalObject();
    if (isObject(unresolvedProperties)) {
      for (const [key, value] of Object.entries(unresolvedProperties)) {
        resolvedProperties[key] = this.#resolvePropertyValue(
          value,
          surface,
          visited,
          dataContextPath
        );
      }
    }

    visited.delete(componentId);

    // Now that we have the resolved properties in place we can go ahead and
    // ensure that they meet expectations in terms of types and so forth,
    // casting them into the specific shape for usage.
    const baseNode = { id: componentId, dataContextPath };
    switch (componentType) {
      case "Heading":
        if (!isResolvedHeading(resolvedProperties)) {
          throw new Error(`Invalid data; expected ${componentType}`);
        }
        return new SignalObject({
          ...baseNode,
          type: "Heading",
          properties: resolvedProperties,
        }) as AnyComponentNode;

      case "Text":
        if (!isResolvedText(resolvedProperties)) {
          throw new Error(`Invalid data; expected ${componentType}`);
        }
        return new SignalObject({
          ...baseNode,
          type: "Text",
          properties: resolvedProperties,
        }) as AnyComponentNode;

      case "Image":
        if (!isResolvedImage(resolvedProperties)) {
          throw new Error(`Invalid data; expected ${componentType}`);
        }
        return new SignalObject({
          ...baseNode,
          type: "Image",
          properties: resolvedProperties,
        }) as AnyComponentNode;

      case "Video":
        if (!isResolvedVideo(resolvedProperties)) {
          throw new Error(`Invalid data; expected ${componentType}`);
        }
        return new SignalObject({
          ...baseNode,
          type: "Video",
          properties: resolvedProperties,
        }) as AnyComponentNode;

      case "AudioPlayer":
        if (!isResolvedAudioPlayer(resolvedProperties)) {
          throw new Error(`Invalid data; expected ${componentType}`);
        }
        return new SignalObject({
          ...baseNode,
          type: "AudioPlayer",
          properties: resolvedProperties,
        }) as AnyComponentNode;

      case "Row":
        if (!isResolvedRow(resolvedProperties)) {
          throw new Error(`Invalid data; expected ${componentType}`);
        }

        return new SignalObject({
          ...baseNode,
          type: "Row",
          properties: resolvedProperties,
        }) as AnyComponentNode;

      case "Column":
        if (!isResolvedColumn(resolvedProperties)) {
          throw new Error(`Invalid data; expected ${componentType}`);
        }

        return new SignalObject({
          ...baseNode,
          type: "Column",
          properties: resolvedProperties,
        }) as AnyComponentNode;

      case "List":
        if (!isResolvedList(resolvedProperties)) {
          throw new Error(`Invalid data; expected ${componentType}`);
        }
        return new SignalObject({
          ...baseNode,
          type: "List",
          properties: resolvedProperties,
        }) as AnyComponentNode;

      case "Card":
        if (!isResolvedCard(resolvedProperties)) {
          console.log(resolvedProperties);
          throw new Error(`Invalid data; expected ${componentType}`);
        }
        return new SignalObject({
          ...baseNode,
          type: "Card",
          properties: resolvedProperties,
        }) as AnyComponentNode;

      case "Tabs":
        if (!isResolvedTabs(resolvedProperties)) {
          throw new Error(`Invalid data; expected ${componentType}`);
        }
        return new SignalObject({
          ...baseNode,
          type: "Tabs",
          properties: resolvedProperties,
        }) as AnyComponentNode;

      case "Divider":
        if (!isResolvedDivider(resolvedProperties)) {
          throw new Error(`Invalid data; expected ${componentType}`);
        }
        return new SignalObject({
          ...baseNode,
          type: "Divider",
          properties: resolvedProperties,
        }) as AnyComponentNode;

      case "Modal":
        if (!isResolvedModal(resolvedProperties)) {
          throw new Error(`Invalid data; expected ${componentType}`);
        }
        return new SignalObject({
          ...baseNode,
          type: "Modal",
          properties: resolvedProperties,
        }) as AnyComponentNode;

      case "Button":
        if (!isResolvedButton(resolvedProperties)) {
          throw new Error(`Invalid data; expected ${componentType}`);
        }
        return new SignalObject({
          ...baseNode,
          type: "Button",
          properties: resolvedProperties,
        }) as AnyComponentNode;

      case "Checkbox":
        if (!isResolvedCheckbox(resolvedProperties)) {
          throw new Error(`Invalid data; expected ${componentType}`);
        }
        return new SignalObject({
          ...baseNode,
          type: "Checkbox",
          properties: resolvedProperties,
        }) as AnyComponentNode;

      case "TextField":
        if (!isResolvedTextField(resolvedProperties)) {
          throw new Error(`Invalid data; expected ${componentType}`);
        }
        return new SignalObject({
          ...baseNode,
          type: "TextField",
          properties: resolvedProperties,
        }) as AnyComponentNode;

      case "DateTimeInput":
        if (!isResolvedDateTimeInput(resolvedProperties)) {
          throw new Error(`Invalid data; expected ${componentType}`);
        }
        return new SignalObject({
          ...baseNode,
          type: "DateTimeInput",
          properties: resolvedProperties,
        }) as AnyComponentNode;

      case "MultipleChoice":
        if (!isResolvedMultipleChoice(resolvedProperties)) {
          throw new Error(`Invalid data; expected ${componentType}`);
        }
        return new SignalObject({
          ...baseNode,
          type: "MultipleChoice",
          properties: resolvedProperties,
        }) as AnyComponentNode;

      case "Slider":
        if (!isResolvedSlider(resolvedProperties)) {
          throw new Error(`Invalid data; expected ${componentType}`);
        }
        return new SignalObject({
          ...baseNode,
          type: "Slider",
          properties: resolvedProperties,
        }) as AnyComponentNode;

      default:
        throw new Error(`Unknown component type: "${componentType}"`);
    }
  }

  /**
   * Recursively resolves an individual property value. If a property indicates
   * a child node (a string that matches a component ID), an explicitList of
   * children, or a template, these will be built out here.
   */
  #resolvePropertyValue(
    value: unknown,
    surface: Surface,
    visited: Set<string>,
    dataContextPath: string
  ): ResolvedValue {
    // 1. If it's a string that matches a component ID, build that node.
    if (typeof value === "string" && surface.components.has(value)) {
      return this.#buildNodeRecursive(value, surface, visited, dataContextPath);
    }

    // 2. If it's a ComponentArrayReference (e.g., a `children` property),
    //    resolve the list and return an array of nodes.
    if (isComponentArrayReference(value)) {
      if (value.explicitList) {
        return value.explicitList.map((id) =>
          this.#buildNodeRecursive(id, surface, visited, dataContextPath)
        );
      }

      if (value.template) {
        const data = this.#getDataByPath(
          surface.dataModel,
          value.template.dataBinding
        );

        const template = value.template;
        if (Array.isArray(data)) {
          return data.map((_, index) => {
            const syntheticId = `${template.componentId}:${index}`;
            const childDataContextPath = `${template.dataBinding}/${index}`;

            return this.#buildNodeRecursive(
              syntheticId,
              surface,
              visited,
              childDataContextPath
            );
          });
        }

        // Return empty array if the data is not ready yet.
        return new SignalArray();
      }
    }

    // 3. If it's a plain array, resolve each of its items.
    if (Array.isArray(value)) {
      return value.map((item) =>
        this.#resolvePropertyValue(item, surface, visited, dataContextPath)
      );
    }

    // 4. If it's a plain object, resolve each of its properties.
    if (isObject(value)) {
      const newObj: ResolvedMap = new SignalObject();
      for (const [key, propValue] of Object.entries(value)) {
        // Special case for paths. Here we might get /item/ or ./ on the front
        // of the path which isn't what we want. In this case we check the
        // dataContextPath and if 1) it's not the default and 2) we also see the
        // path beginning with /item/ or ./we trim it.
        let propertyValue = propValue;
        if (isPath(key, propValue) && dataContextPath !== "/") {
          propertyValue = propValue.replace(/^\/item/, "").replace(/^.\//, "/");
        }

        newObj[key] = this.#resolvePropertyValue(
          propertyValue,
          surface,
          visited,
          dataContextPath
        );
      }
      return newObj;
    }

    // 5. Otherwise, it's a primitive value.
    return value as ResolvedValue;
  }
}
