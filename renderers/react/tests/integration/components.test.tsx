import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React, { useEffect } from 'react';
import { A2UIProvider, A2UIRenderer, useA2UI } from '../../src';
import type { Types } from '@a2ui/lit/0.8';
import {
  TestWrapper,
  TestRenderer,
  createSurfaceUpdate,
  createBeginRendering,
} from '../utils';

/**
 * Component Integration Tests
 *
 * Tests for component updates, nested components, and error handling.
 */

describe('Component Updates', () => {
  it('should update component props when new message received', () => {
    function UpdateRenderer() {
      const { processMessages } = useA2UI();

      useEffect(() => {
        processMessages([
          createSurfaceUpdate([
            { id: 'text-1', component: { Text: { text: { literalString: 'Before' } } } },
          ]),
          createBeginRendering('text-1'),
        ]);

        setTimeout(() => {
          processMessages([
            createSurfaceUpdate([
              { id: 'text-1', component: { Text: { text: { literalString: 'After' } } } },
            ]),
            createBeginRendering('text-1'),
          ]);
        }, 10);
      }, [processMessages]);

      return <A2UIRenderer surfaceId="@default" />;
    }

    render(
      <A2UIProvider>
        <UpdateRenderer />
      </A2UIProvider>
    );

    expect(screen.getByText('Before')).toBeInTheDocument();

    return waitFor(() => {
      expect(screen.getByText('After')).toBeInTheDocument();
    });
  });

  it('should handle component type change', () => {
    function TypeChangeRenderer() {
      const { processMessages } = useA2UI();

      useEffect(() => {
        processMessages([
          createSurfaceUpdate([
            { id: 'comp-1', component: { Text: { text: { literalString: 'I am text' } } } },
          ]),
          createBeginRendering('comp-1'),
        ]);

        setTimeout(() => {
          processMessages([
            createSurfaceUpdate([
              { id: 'btn-text', component: { Text: { text: { literalString: 'Click me' } } } },
              { id: 'comp-1', component: { Button: { child: 'btn-text', action: { name: 'test' } } } },
            ]),
            createBeginRendering('comp-1'),
          ]);
        }, 10);
      }, [processMessages]);

      return <A2UIRenderer surfaceId="@default" />;
    }

    render(
      <A2UIProvider>
        <TypeChangeRenderer />
      </A2UIProvider>
    );

    expect(screen.getByText('I am text')).toBeInTheDocument();

    return waitFor(() => {
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });
  });

  it('should add new components to existing surface', () => {
    function AddComponentRenderer() {
      const { processMessages } = useA2UI();

      useEffect(() => {
        processMessages([
          createSurfaceUpdate([
            { id: 'text-1', component: { Text: { text: { literalString: 'First' } } } },
          ]),
          createBeginRendering('text-1'),
        ]);

        setTimeout(() => {
          processMessages([
            createSurfaceUpdate([
              { id: 'text-1', component: { Text: { text: { literalString: 'First' } } } },
              { id: 'text-2', component: { Text: { text: { literalString: 'Second' } } } },
              { id: 'col-1', component: { Column: { children: { explicitList: ['text-1', 'text-2'] } } } },
            ]),
            createBeginRendering('col-1'),
          ]);
        }, 10);
      }, [processMessages]);

      return <A2UIRenderer surfaceId="@default" />;
    }

    render(
      <A2UIProvider>
        <AddComponentRenderer />
      </A2UIProvider>
    );

    return waitFor(() => {
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });
  });
});

describe('Nested Components', () => {
  it('should render deeply nested component structures', () => {
    const messages: Types.ServerToClientMessage[] = [
      createSurfaceUpdate([
        { id: 'inner-text', component: { Text: { text: { literalString: 'Deep content' } } } },
        { id: 'inner-card', component: { Card: { child: 'inner-text' } } },
        { id: 'inner-col', component: { Column: { children: { explicitList: ['inner-card'] } } } },
        { id: 'outer-card', component: { Card: { child: 'inner-col' } } },
        { id: 'outer-col', component: { Column: { children: { explicitList: ['outer-card'] } } } },
      ]),
      createBeginRendering('outer-col'),
    ];

    const { container } = render(
      <TestWrapper>
        <TestRenderer messages={messages} />
      </TestWrapper>
    );

    expect(screen.getByText('Deep content')).toBeInTheDocument();

    const cards = container.querySelectorAll('.a2ui-card');
    expect(cards.length).toBe(2);
  });

  it('should handle List with multiple items', () => {
    const messages: Types.ServerToClientMessage[] = [
      createSurfaceUpdate([
        { id: 'item-1', component: { Text: { text: { literalString: 'Item 1' } } } },
        { id: 'item-2', component: { Text: { text: { literalString: 'Item 2' } } } },
        { id: 'item-3', component: { Text: { text: { literalString: 'Item 3' } } } },
        {
          id: 'list-1',
          component: {
            List: { children: { explicitList: ['item-1', 'item-2', 'item-3'] } },
          },
        },
      ]),
      createBeginRendering('list-1'),
    ];

    render(
      <TestWrapper>
        <TestRenderer messages={messages} />
      </TestWrapper>
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('should handle Row with mixed children', () => {
    const messages: Types.ServerToClientMessage[] = [
      createSurfaceUpdate([
        { id: 'text-1', component: { Text: { text: { literalString: 'Label' } } } },
        { id: 'btn-text', component: { Text: { text: { literalString: 'Action' } } } },
        { id: 'btn-1', component: { Button: { child: 'btn-text', action: { name: 'act' } } } },
        { id: 'icon-1', component: { Icon: { name: { literalString: 'home' } } } },
        {
          id: 'row-1',
          component: {
            Row: { children: { explicitList: ['text-1', 'btn-1', 'icon-1'] } },
          },
        },
      ]),
      createBeginRendering('row-1'),
    ];

    const { container } = render(
      <TestWrapper>
        <TestRenderer messages={messages} />
      </TestWrapper>
    );

    expect(screen.getByText('Label')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    expect(container.querySelector('.a2ui-icon')).toBeInTheDocument();
  });
});

describe('Error Handling', () => {
  it('should throw error for invalid component data', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const messages: Types.ServerToClientMessage[] = [
      createSurfaceUpdate([
        { id: 'btn-1', component: { Button: { child: 'non-existent', action: { name: 'test' } } } },
      ]),
      createBeginRendering('btn-1'),
    ];

    expect(() => {
      render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );
    }).toThrow();

    consoleSpy.mockRestore();
  });

  it('should render valid content without issues', () => {
    const messages: Types.ServerToClientMessage[] = [
      createSurfaceUpdate([
        { id: 'text-1', component: { Text: { text: { literalString: 'Safe content' } } } },
      ]),
      createBeginRendering('text-1'),
    ];

    render(
      <TestWrapper>
        <TestRenderer messages={messages} />
      </TestWrapper>
    );

    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });
});
