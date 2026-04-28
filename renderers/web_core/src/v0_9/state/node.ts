/*
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Signal, signal} from '@preact/signals-core';
import {z} from 'zod';
import {EventEmitter, EventSource} from '../common/events.js';
import {ComponentContext} from '../rendering/component-context.js';
import {GenericBinder, NodeResolver} from '../rendering/generic-binder.js';
import {SurfaceModel} from './surface-model.js';
import {A2uiNode} from './node-types.js';

/**
 * Internal implementation of the A2uiNode interface.
 */
export class NodeImpl<TProps = Record<string, any>> implements A2uiNode<TProps> {
  private readonly _onDestroyed = new EventEmitter<void>();
  private readonly _props = signal<TProps>({} as TProps);
  private binder: GenericBinder<TProps>;
  private binderUnsub: {unsubscribe: () => void};

  readonly onDestroyed: EventSource<void> = this._onDestroyed;

  constructor(
    readonly instanceId: string,
    readonly componentId: string,
    readonly type: string,
    readonly dataPath: string,
    surface: SurfaceModel<any>,
    nodeResolver: NodeResolver,
  ) {
    const context = new ComponentContext(surface, componentId, dataPath);
    const catalogEntry = surface.catalog.components.get(type);
    const schema = catalogEntry?.schema || z.object({});

    this.binder = new GenericBinder<TProps>(context, schema, nodeResolver);
    this.binderUnsub = this.binder.subscribe(props => {
      this._props.value = props;
    });
    // Initial props
    this._props.value = this.binder.snapshot;
  }

  get props(): Signal<TProps> {
    return this._props;
  }

  dispose(): void {
    this.binderUnsub.unsubscribe();
    this.binder.dispose();
    this._onDestroyed.emit();
    this._onDestroyed.dispose();
  }
}

/**
 * Manages the mapping between ComponentModels and A2uiNode instances.
 */
export class NodeManager implements NodeResolver {
  private nodes = new Map<string, A2uiNode>();
  private refCounts = new Map<string, number>();

  constructor(private surface: SurfaceModel<any>) {}

  /**
   * Resolves a node for the given component ID and data path.
   * If a node already exists for this instance ID, its reference count is incremented.
   * Returns undefined if the component ID does not exist in the components model.
   */
  resolveNode(componentId: string, dataPath: string): A2uiNode | undefined {
    const instanceId = this.createInstanceId(componentId, dataPath);
    let node = this.nodes.get(instanceId);

    if (!node) {
      const component = this.surface.componentsModel.get(componentId);
      if (!component) {
        return undefined;
      }
      node = new NodeImpl(
        instanceId,
        componentId,
        component.type,
        dataPath,
        this.surface,
        this,
      );
      this.nodes.set(instanceId, node);
      this.refCounts.set(instanceId, 1);
    } else {
      this.refCounts.set(instanceId, (this.refCounts.get(instanceId) || 0) + 1);
    }

    return node;
  }

  /**
   * Decrements the reference count for a node and disposes of it if it reaches zero.
   * This is intended to be used by the GenericBinder or parent nodes when a child is removed.
   */
  releaseNode(node: A2uiNode | undefined): void {
    if (!node) return;
    const count = this.refCounts.get(node.instanceId) || 0;
    if (count <= 1) {
      this.nodes.delete(node.instanceId);
      this.refCounts.delete(node.instanceId);
      node.dispose();
    } else {
      this.refCounts.set(node.instanceId, count - 1);
    }
  }

  private createInstanceId(componentId: string, dataPath: string): string {
    return dataPath === '/' || dataPath === ''
      ? componentId
      : `${componentId}-[${dataPath}]`;
  }

  dispose(): void {
    for (const node of this.nodes.values()) {
      node.dispose();
    }
    this.nodes.clear();
    this.refCounts.clear();
  }
}
