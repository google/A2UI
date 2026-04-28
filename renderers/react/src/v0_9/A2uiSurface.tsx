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

import React, {useSyncExternalStore, memo, useCallback, createContext, useContext} from 'react';
import {type SurfaceModel, type A2uiNode} from '@a2ui/web_core/v0_9';
import type {ReactComponentImplementation} from './adapter';

const SurfaceContext = createContext<SurfaceModel<ReactComponentImplementation> | undefined>(undefined);

export const useSurface = () => {
  const surface = useContext(SurfaceContext);
  if (!surface) {
    throw new Error('useSurface must be used within an A2uiSurface');
  }
  return surface;
};

const useNodeStore = (signal?: {subscribe: (cb: (val: any) => void) => () => void, peek: () => any}) => {
  const subscribe = useCallback(
    (callback: () => void) => {
      if (!signal) return () => {};
      const dispose = signal.subscribe(() => {
        callback();
      });
      return () => dispose();
    },
    [signal]
  );
  const getSnapshot = useCallback(() => signal?.peek(), [signal]);
  return useSyncExternalStore(subscribe, getSnapshot);
};

export const NodeRenderer = memo(
  ({
    node,
  }: {
    node: A2uiNode;
  }) => {
    const surface = useSurface();
    // 1. Subscribe specifically to this node's destruction
    const isDestroyed = useSyncExternalStore(
      useCallback((cb: () => void) => {
        let active = true;
        const sub = node.onDestroyed.subscribe(() => {
          if (active) cb();
        });
        return () => {
          active = false;
          sub.unsubscribe();
        };
      }, [node]),
      () => false // It's only true if the callback fires, causing unmount
    );

    if (isDestroyed) {
      return null;
    }

    const compImpl = surface.catalog.components.get(node.type);

    if (!compImpl) {
      return <div style={{color: 'red'}}>Unknown component: {node.type}</div>;
    }

    const ComponentToRender = compImpl.render;

    return <ComponentToRender node={node} />;
  }
);
NodeRenderer.displayName = 'NodeRenderer';

export const A2uiSurface: React.FC<{surface: SurfaceModel<ReactComponentImplementation>}> = ({
  surface,
}) => {
  const rootNode = useNodeStore(surface?.rootNode);

  if (!surface) return null;

  return (
    <SurfaceContext.Provider value={surface}>
      {!rootNode ? (
        <div style={{color: 'gray', padding: '4px'}}>[Loading root...]</div>
      ) : (
        <NodeRenderer node={rootNode} />
      )}
    </SurfaceContext.Provider>
  );
};
