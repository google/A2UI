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

import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { createReactComponent } from '../../src/v0_9/adapter';
import { ComponentContext, ComponentModel, SurfaceModel, Catalog, CommonSchemas } from '@a2ui/web_core/v0_9';
import { z } from 'zod';

const mockCatalog = new Catalog('test', [], []);

describe('adapter', () => {
  it('should render component with resolved props', () => {
    const surface = new SurfaceModel<any>('test-surface', mockCatalog);
    const compModel = new ComponentModel('c1', 'TestComp', { text: 'Hello World', child: 'child1' });
    surface.componentsModel.addComponent(compModel);

    const context = new ComponentContext(surface, 'c1', '/');

    const TestApiDef = {
      name: 'TestComp',
      schema: z.object({
        text: CommonSchemas.DynamicString,
        child: CommonSchemas.ComponentId
      })
    };

    const TestComponent = createReactComponent(
      TestApiDef,
      ({ props, buildChild }) => {
        return <div>
          <span>{props.text}</span>
          {props.child && buildChild(props.child)}
        </div>;
      }
    );

    const buildChild = vi.fn().mockImplementation((id) => <div data-testid={id}>Child</div>);

    render(<TestComponent.render context={context} buildChild={buildChild} />);

    expect(screen.getByText('Hello World')).toBeDefined();
    expect(screen.getByTestId('child1')).toBeDefined();
  });

  it('should react to data model changes', async () => {
    const surface = new SurfaceModel<any>('test-surface', mockCatalog);
    const compModel = new ComponentModel('c1', 'TestComp', { text: { path: '/greeting' } });
    surface.componentsModel.addComponent(compModel);
    
    // Set initial data
    surface.dataModel.set('/greeting', 'Hello Reactive');

    const context = new ComponentContext(surface, 'c1', '/');

    const TestApiDef = {
      name: 'TestComp',
      schema: z.object({
        text: CommonSchemas.DynamicString
      })
    };

    const TestComponent = createReactComponent(
      TestApiDef,
      ({ props }) => {
        return <div data-testid="msg">{props.text}</div>;
      }
    );

    const { getByTestId } = render(<TestComponent.render context={context} buildChild={() => null} />);

    expect(getByTestId('msg').textContent).toBe('Hello Reactive');

    // Update data model
    await act(async () => {
      surface.dataModel.set('/greeting', 'Updated Greeting');
    });

    expect(getByTestId('msg').textContent).toBe('Updated Greeting');
  });

  it('should clean up listeners on unmount', () => {
    const surface = new SurfaceModel<any>('test-surface', mockCatalog);
    const compModel = new ComponentModel('c1', 'TestComp', { text: { path: '/greeting' } });
    surface.componentsModel.addComponent(compModel);
    
    const context = new ComponentContext(surface, 'c1', '/');

    const spyAddListener = vi.spyOn(context.dataContext, 'subscribeDynamicValue');

    const TestApiDef = {
      name: 'TestComp',
      schema: z.object({
        text: CommonSchemas.DynamicString
      })
    };

    const TestComponent = createReactComponent(
      TestApiDef,
      ({ props }) => {
        return <div>{props.text}</div>;
      }
    );

    const { unmount } = render(<TestComponent.render context={context} buildChild={() => null} />);

    expect(spyAddListener).toHaveBeenCalled();
    // One listener added
    
    unmount();
    
    // We would need a way to check if removeListener was called, but checking that the binding logic doesn't crash on unmount is a good start.
    // If listeners aren't cleaned up, subsequent updates might throw if component is destroyed.
  });

  it('preserves progressive rendering (avoids stale closures from over-memoization)', async () => {
    const surface = new SurfaceModel<any>('test-surface', mockCatalog);
    
    // 1. Initial State: Parent component exists, but its child is missing from the surface.
    const parentModel = new ComponentModel('parent', 'TestParent', { child: 'child1' });
    surface.componentsModel.addComponent(parentModel);

    const context = new ComponentContext(surface, 'parent', '/');

    const TestParentDef = {
      name: 'TestParent',
      schema: z.object({ child: CommonSchemas.ComponentId })
    };

    const TestParent = createReactComponent(
      TestParentDef,
      ({ props, buildChild }) => {
        return <div data-testid="parent">
          {props.child && buildChild(props.child)}
        </div>;
      }
    );

    // Mock buildChild matching the logic in A2uiSurface.tsx:
    // It looks up the child; if missing, returns a loading state.
    const buildChild = vi.fn().mockImplementation((id) => {
      const childModel = surface.componentsModel.get(id);
      if (!childModel) return <span data-testid="loading">Loading {id}...</span>;
      return <span data-testid="resolved">{childModel.properties.text}</span>;
    });

    const { getByTestId, rerender } = render(<TestParent.render context={context} buildChild={buildChild} />);

    // Assert the missing child renders the fallback
    expect(getByTestId('loading').textContent).toBe('Loading child1...');

    // 2. Simulate streaming 'updateComponents' adding the missing child
    await act(async () => {
      surface.componentsModel.addComponent(new ComponentModel('child1', 'TestChild', { text: 'Loaded Data' }));
    });

    // 3. Simulate the top-down re-render triggered by A2uiSurface
    const newContext = new ComponentContext(surface, 'parent', '/');
    const newBuildChild = vi.fn().mockImplementation((id) => {
      const childModel = surface.componentsModel.get(id);
      if (!childModel) return <span data-testid="loading">Loading {id}...</span>;
      return <span data-testid="resolved">{childModel.properties.text}</span>;
    });

    rerender(<TestParent.render context={newContext} buildChild={newBuildChild} />);

    // By not memoizing the wrapper aggressively, we ensure the new child renders correctly during streaming.
    expect(() => getByTestId('loading')).toThrow();
    expect(getByTestId('resolved').textContent).toBe('Loaded Data');
  });
});
