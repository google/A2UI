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

import React from 'react';
import { render, act } from '@testing-library/react';
import { vi } from 'vitest';
import { SurfaceModel, ComponentModel, Catalog, A2uiNode } from '@a2ui/web_core/v0_9';
import { BASIC_FUNCTIONS } from '@a2ui/web_core/v0_9/basic_catalog';
import type { ReactComponentImplementation } from '../src/v0_9/adapter';
import { A2uiSurface, useSurface } from '../src/v0_9/A2uiSurface';

export interface RenderA2uiOptions {
  initialData?: Record<string, any>;
  /** Additional component implementations needed by the children */
  additionalImpls?: ReactComponentImplementation[];
  /** Pre-instantiated ComponentModels for child components */
  additionalComponents?: ComponentModel[];
  /** Functions to include in the catalog */
  functions?: any[];
}

/**
 * A robust test utility for rendering A2UI React components in isolation
 * while maintaining a real A2UI state lifecycle.
 */
export function renderA2uiComponent(
  impl: ReactComponentImplementation,
  componentId: string,
  initialProperties: Record<string, any>,
  options: RenderA2uiOptions = {}
) {
  const { 
    initialData = {}, 
    additionalImpls = [], 
    additionalComponents = [],
    functions = BASIC_FUNCTIONS
  } = options;

  // Combine all implementations into the catalog
  const allImpls = [impl, ...additionalImpls];
  const catalog = new Catalog('test-catalog', allImpls, functions);
  const surface = new SurfaceModel<ReactComponentImplementation>('test-surface', catalog);
  
  // Setup data model
  surface.dataModel.set('/', initialData);

  // Add the component under test
  const mainModel = new ComponentModel(componentId, impl.name, initialProperties);
  surface.componentsModel.addComponent(mainModel);

  // Add any explicitly defined child component models
  for (const childModel of additionalComponents) {
    surface.componentsModel.addComponent(childModel);
  }

  // Resolve the node for the component under test
  let node: A2uiNode;
  if (componentId === 'root') {
     node = surface.rootNode.value!;
  } else {
     node = (surface as any)._nodeManager.resolveNode(componentId, '/');
  }

  const buildChild = vi.fn((nodeOrId: any) => {
    if (!nodeOrId) return null;
    
    if (typeof nodeOrId === 'object' && 'instanceId' in nodeOrId) {
      return <NodeRenderer key={nodeOrId.instanceId} node={nodeOrId as A2uiNode} />;
    }
    
    return <div data-testid={`child-${typeof nodeOrId === 'string' ? nodeOrId : nodeOrId.componentId}`} />;
  });

  const ComponentToRender = impl.render;

  const view = render(
    <A2uiSurface surface={surface}>
        {componentId !== 'root' ? <ComponentToRender node={node} buildChild={buildChild} /> : <NodeRenderer node={node} />}
    </A2uiSurface>
  );

  return { 
    view, 
    surface, 
    buildChild, 
    mainModel,
    node,
    // Helper to trigger data model updates and wait for re-render
    updateData: async (path: string, value: any) => {
      await act(async () => {
        surface.dataModel.set(path, value);
        // Wait for React to process the useSyncExternalStore update
        await new Promise(resolve => setTimeout(resolve, 0));
      });
    }
  };
}
