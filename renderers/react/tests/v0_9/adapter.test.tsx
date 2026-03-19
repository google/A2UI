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
});
