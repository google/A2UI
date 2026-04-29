/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, {useSyncExternalStore, useCallback, memo} from 'react';
import type {
  ComponentApi,
  InferredComponentApiSchemaType,
  ResolveA2uiProps,
  A2uiNode,
} from '@a2ui/web_core/v0_9';
import {NodeRenderer} from './A2uiSurface';

export interface ReactComponentImplementation extends ComponentApi {
  /** The framework-specific rendering wrapper. */
  render: React.FC<{
    node: A2uiNode;
    buildChild?: (nodeOrId: A2uiNode | string) => React.ReactNode;
  }>;
}

export type ReactA2uiComponentProps<T> = {
  props: T;
  node: A2uiNode;
  buildChild: (nodeOrId: any) => React.ReactNode;
};

/**
 * Hook to subscribe to an A2uiNode's properties.
 */
export function useNodeProps<T>(node: A2uiNode<T>): T {
  const subscribe = useCallback(
    (callback: () => void) => {
      if (!node) return () => {};
      // Create a reactive effect that re-runs the callback when props change
      const dispose = node.props.subscribe(() => {
        callback();
      });
      return () => dispose();
    },
    [node]
  );

  const getSnapshot = useCallback(() => node?.props.peek(), [node]);

  return useSyncExternalStore(subscribe, getSnapshot);
}

// --- Component Factories ---

/**
 * Creates a React component implementation using the Node Layer.
 */
export function createComponentImplementation<Api extends ComponentApi>(
  api: Api,
  RenderComponent: React.FC<
    ReactA2uiComponentProps<ResolveA2uiProps<InferredComponentApiSchemaType<Api>>>
  >
): ReactComponentImplementation {
  type Props = ResolveA2uiProps<InferredComponentApiSchemaType<Api>>;

  const MemoizedRender = memo(RenderComponent, (prev, next) => {
    if (prev.props !== next.props) return false;
    if (prev.node.instanceId !== next.node.instanceId) return false;
    return true;
  });

  const ReactWrapper: React.FC<{
    node: A2uiNode;
    buildChild?: (nodeOrId: any) => React.ReactNode;
  }> = ({node, buildChild: providedBuildChild}) => {
    const props = useNodeProps(node as A2uiNode<Props>);

    // Trivial backward-compatible buildChild
    const internalBuildChild = useCallback((nodeOrId: any) => {
      if (typeof nodeOrId === 'object' && nodeOrId && 'instanceId' in nodeOrId) {
        return <NodeRenderer key={nodeOrId.instanceId} node={nodeOrId as A2uiNode} />;
      }
      console.warn(
        'buildChild expects an A2uiNode object, but received a string ID. The generic binder should resolve IDs into Node objects.'
      );
      return null;
    }, []);

    const buildChild = providedBuildChild || internalBuildChild;

    return <MemoizedRender props={props || ({} as Props)} node={node} buildChild={buildChild} />;
  };

  return {
    name: api.name,
    schema: api.schema,
    render: ReactWrapper,
  };
}

/**
 * Creates a React component implementation that manages its own bindings.
 */
export function createBinderlessComponentImplementation(
  api: ComponentApi,
  RenderComponent: React.FC<{
    node: A2uiNode;
    buildChild?: (nodeOrId: any) => React.ReactNode;
  }>
): ReactComponentImplementation {
  return {
    name: api.name,
    schema: api.schema,
    render: RenderComponent,
  };
}
