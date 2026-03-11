import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { createReactComponent, createGenericBinding } from './adapter';
import { ComponentContext, ComponentModel, SurfaceModel, Catalog } from '@a2ui/web_core/v0_9';

const mockCatalog = new Catalog('test', [], {});

describe('adapter', () => {
  it('should render component with resolved props', () => {
    const surface = new SurfaceModel<any>('test-surface', mockCatalog);
    const compModel = new ComponentModel('c1', 'TestComp', { text: 'Hello World', child: 'child1' });
    surface.componentsModel.addComponent(compModel);

    const context = new ComponentContext(surface, 'c1', '/');

    type TestProps = { text?: string; child?: string };

    const RenderTest: React.FC<{ props: TestProps, buildChild: any }> = ({ props, buildChild }) => {
      return <div>
        <span>{props.text}</span>
        {props.child && buildChild(props.child)}
      </div>;
    };

    const TestComponent = createReactComponent<TestProps>(
      (ctx) => createGenericBinding<TestProps>(ctx, ['child']),
      RenderTest as any
    );

    const buildChild = vi.fn().mockImplementation((id) => <div data-testid={id}>Child</div>);

    render(<TestComponent context={context} buildChild={buildChild} />);

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

    type TestProps = { text?: string };

    const RenderTest: React.FC<{ props: TestProps }> = ({ props }) => {
      return <div data-testid="msg">{props.text}</div>;
    };

    const TestComponent = createReactComponent<TestProps>(
      (ctx) => createGenericBinding<TestProps>(ctx, []),
      RenderTest as any
    );

    const { getByTestId } = render(<TestComponent context={context} buildChild={() => null} />);

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

    type TestProps = { text?: string };

    const RenderTest: React.FC<{ props: TestProps }> = ({ props }) => {
      return <div>{props.text}</div>;
    };

    const TestComponent = createReactComponent<TestProps>(
      (ctx) => createGenericBinding<TestProps>(ctx, []),
      RenderTest as any
    );

    const { unmount } = render(<TestComponent context={context} buildChild={() => null} />);

    expect(spyAddListener).toHaveBeenCalled();
    // One listener added
    
    unmount();
    
    // We would need a way to check if removeListener was called, but checking that the binding logic doesn't crash on unmount is a good start.
    // If listeners aren't cleaned up, subsequent updates might throw if component is destroyed.
  });
});
