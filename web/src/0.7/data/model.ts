/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { UnifiedMesssages, type GulfData } from "../types/types.js";
import {
  Card,
  Column,
  Component,
  ComponentRef,
  List,
  Row,
} from "../types/component-update.js";
import {
  DataModelUpdateMessage,
  DataObject,
  DataValue,
} from "../types/data-update.js";
import { deep } from "signal-utils/deep";
import { SignalObject } from "signal-utils/object";
import { SignalMap } from "signal-utils/map";
import {
  isBeginRendering,
  isComponentUpdate,
  isDataModelUpdate,
  isStreamHeader,
} from "./guards.js";

export { DataModel };

const componentsWithChildren = ["Row", "Column", "List"] as const;
const componentsWithChild = ["Card"] as const;

type ComponentsWithChildren = (typeof componentsWithChildren)[number];
type ComponentsWithChild = (typeof componentsWithChild)[number];

function isComponentWithChildren(key: string): key is ComponentsWithChildren {
  return (componentsWithChildren as readonly string[]).includes(key);
}

function isComponentWithChild(key: string): key is ComponentsWithChild {
  return (componentsWithChild as readonly string[]).includes(key);
}

class DataModel {
  #rootChanged = false;
  #model: GulfData = new SignalObject({
    // @ts-expect-error SignalMap does not have 2023's dispose method.
    data: new SignalMap() as DataObject,
  }) as GulfData;
  #watchers = new Map<string, Array<(data: DataValue) => void>>();
  #components: Component[] = [];
  #finalized = false;

  get current(): Required<GulfData> | null {
    if (!this.#model) {
      return null;
    }

    if (!this.#model.rootName) {
      throw new Error("Unable to get current; no root name");
    }

    if (!this.#model.root) {
      throw new Error("Unable to get current; no root");
    }

    if (!this.#model.data) {
      throw new Error("Unable to get current; no data");
    }

    // Revert to 0.7 if no version was provided.
    if (!this.#model.version) {
      this.#model.version = "0.7";
    }

    return this.#model as Required<GulfData>;
  }

  /**
   * Used to track work initiated in the append call. This way if finalized is
   * called we wait until all the active work has finished running.
   */
  #pendingWork: Promise<void>[] = [];
  async append(data: UnifiedMesssages) {
    if (this.#finalized) {
      throw new Error("Data appended while model is finalized");
    }

    for (const msg of data) {
      if (isStreamHeader(msg)) {
        this.#model.version = this.#model.version ?? msg.version;
      } else if (isBeginRendering(msg)) {
        this.#model.rootName = msg.root;
        this.#rootChanged = true;
      } else if (isComponentUpdate(msg)) {
        this.#components.push(...msg.components);

        if (this.#rootChanged) {
          this.#rootChanged = false;

          if (!this.#model.rootName) {
            throw new Error("Unable to retrieve current model; no root name");
          }

          const root = this.#getComponentCopy(this.#model.rootName);
          if (!root) {
            throw new Error("Unable to retrieve current model; no root");
          }
          this.#model.root = root;
          this.#pendingWork.push(this.#buildComponentTree(root));
        }
      } else if (isDataModelUpdate(msg)) {
        this.#pendingWork.push(this.#buildDataTree(msg));
      }
    }
  }

  /**
   * When set this will prevent getDataProperty calls from returning a Promise
   * when an as-yet-unset value is requested. In this way we can distinguish
   * between values that are simply not there *yet* versus those that are not
   * there whatsoever.
   */
  async finalize() {
    await Promise.all(this.#pendingWork);
    this.#pendingWork.length = 0;
    this.#finalized = true;
  }

  #getComponentCopy(id: string) {
    const component = this.#components.find((c) => c.id === id);
    if (component) {
      return deep(structuredClone(component));
    }

    return null;
  }

  async #buildComponentTree(target: Component, dataPrefix = "") {
    target.dataPrefix = dataPrefix;

    const handleExplicitList = async (
      target: Row | Column | List | Card,
      children: string[]
    ) => {
      target.children = [];
      for (const child of children) {
        const component = this.#getComponentCopy(child);
        if (component) {
          target.children.push(component);
          await this.#buildComponentTree(component, dataPrefix);
        }
      }
    };

    const handleTemplate = async (
      target: Row | Column | List | Card,
      template: ComponentRef["template"]
    ) => {
      if (!template) {
        return;
      }
      target.children = [];
      const value: DataValue | null = await this.getDataProperty(
        template.dataBinding,
        dataPrefix
      );

      if (!value || !Array.isArray(value)) {
        return;
      }

      for (let i = 0; i < value.length; i++) {
        const component = this.#getComponentCopy(template.componentId);

        if (component) {
          component.id = globalThis.crypto.randomUUID();
          target.children.push(component);
          await this.#buildComponentTree(
            component,
            `${template.dataBinding}/${i}`
          );
        }
      }
    };

    /**
     * Processes components that have a 'children' property (Row, Column, List)
     */
    async function processMultiChild(
      component: Row | Column | List | undefined
    ) {
      if (!component) {
        return;
      }

      const children = component.children;
      if ("explicitList" in children && children.explicitList) {
        await handleExplicitList(component, children.explicitList);
      } else if ("template" in children && children.template) {
        await handleTemplate(component, children.template);
      }
    }

    /**
     * Processes components that have a single 'child' property (Card)
     */
    async function processSingleChild(component: Card | undefined) {
      if (!component) {
        return;
      }

      const child = component.child;
      if (typeof child === "string") {
        // Treat the single string child as an explicit list of one
        await handleExplicitList(component, [child]);
      }
    }

    for (const key of Object.keys(target.componentProperties)) {
      if (isComponentWithChildren(key)) {
        // 'key' is now correctly typed as 'Row' | 'Column' | 'List'
        // We pass the component to its specific handler
        await processMultiChild(target.componentProperties[key]);
      } else if (isComponentWithChild(key)) {
        // 'key' is now correctly typed as 'Card'
        await processSingleChild(target.componentProperties[key]);
      }
    }
  }

  async #buildDataTree(update: DataModelUpdateMessage) {
    if (Array.isArray(update.contents)) {
      const path = update.path ?? "/";
      await this.setDataProperty(
        path,
        "",
        update.contents as unknown as DataObject
      );
    } else {
      const path = update.path ?? "/";
      for (const [id, obj] of Object.entries(update.contents)) {
        await this.setDataProperty(id, path, obj as DataObject);
      }
    }
  }

  #fixDataPropertyKey(key: string, dataPrefix: string) {
    if (dataPrefix) {
      if (key.startsWith("item.")) {
        key = key.replace(/^item\./, "");
      }

      let joiner = "";
      if (dataPrefix !== "/" && !key.startsWith("/")) {
        joiner = "/";
      }

      key = `${dataPrefix}${joiner}${key}`;
    }

    if (!key.startsWith("/")) {
      key = `/${key}`;
    }

    return key;
  }

  #waitForProperty(key: string): Promise<DataValue | null> {
    return new Promise((resolve) => {
      const callbacks = this.#watchers.get(key) ?? [];
      callbacks.push((data) => {
        resolve(data);
      });
      this.#watchers.set(key, callbacks);
    });
  }

  async getDataProperty(
    key: string,
    dataPrefix = ""
  ): Promise<DataValue | null> {
    key = this.#fixDataPropertyKey(key, dataPrefix);

    let target = this.#model.data;
    const parts = key.split("/");
    const finalPart = parts.at(-1);

    if (!finalPart) {
      console.warn("Unable to set value");
      return null;
    }

    for (let p = 0; p < parts.length - 1; p++) {
      const part = parts[p];
      if (part === "") {
        target = this.#model.data;
        continue;
      }

      let nextTarget: DataValue | undefined;
      if (target instanceof Map && target.has(part)) {
        nextTarget = target.get(part);
      } else if (
        Array.isArray(target) &&
        !Number.isNaN(Number.parseInt(part))
      ) {
        nextTarget = target[Number.parseInt(part)];
      }

      if (nextTarget !== undefined) {
        target = nextTarget as DataObject;
      } else if (this.#finalized) {
        return null;
      } else {
        return this.#waitForProperty(key);
      }
    }

    const value =
      target instanceof Map ? target.get(finalPart) : target?.[finalPart];

    if (value !== undefined) {
      return value;
    }

    if (this.#finalized) {
      return null;
    }

    // The final value doesn't exist yet, so wait for it.
    return this.#waitForProperty(key);
  }

  async setDataProperty(key: string, dataPrefix = "", value: DataValue) {
    key = this.#fixDataPropertyKey(key, dataPrefix);

    let target = this.#model.data;
    const parts = key.split("/");
    const finalPart = parts.at(-1);
    if (!finalPart) {
      console.warn("Unable to set value");
      return;
    }

    for (let p = 0; p < parts.length - 1; p++) {
      const part = parts[p];
      if (part === "") {
        target = this.#model.data;
        continue;
      }

      if (target instanceof Map && target.has(part)) {
        target = target.get(part) as DataObject;
      } else if (target instanceof Map) {
        // @ts-expect-error SignalMap does not have 2023's dispose method.
        const newTarget: DataObject = new SignalMap();
        target.set(part, newTarget);
        target = newTarget;
      } else {
        console.warn("Unable to set on model; no target");
        return;
      }
    }

    // Convert objects to Maps.
    let storedValue: DataValue | null = null;
    if (
      typeof value === "object" &&
      !(value instanceof Map) &&
      !Array.isArray(value)
    ) {
      if (value) {
        // @ts-expect-error SignalMap does not have 2023's dispose method.
        storedValue = new SignalMap(Object.entries(value));
      }
    } else {
      storedValue = deep(value);
    }

    if (target) {
      target.set(finalPart, storedValue);
    } else {
      console.warn("Unable to set on model; no receiver");
      return;
    }

    const watcherCallbacks = this.#watchers.get(key);
    if (watcherCallbacks) {
      for (const watcher of watcherCallbacks) {
        watcher.call(null, storedValue);
      }
    }
    this.#watchers.delete(key);
  }
}
