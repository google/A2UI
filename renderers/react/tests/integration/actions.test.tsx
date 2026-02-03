import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import type { Types } from '@a2ui/lit/0.8';
import {
  TestWrapper,
  TestRenderer,
  createSurfaceUpdate,
  createBeginRendering,
  getMockCallArg,
} from '../utils';

/**
 * Action Dispatch Integration Tests
 *
 * Tests for dispatching actions from components to the onAction callback.
 */

describe('Action Dispatch', () => {
  it('should dispatch action with name', () => {
    const mockOnAction = vi.fn();
    const messages: Types.ServerToClientMessage[] = [
      createSurfaceUpdate([
        { id: 'btn-text', component: { Text: { text: { literalString: 'Submit' } } } },
        { id: 'btn-1', component: { Button: { child: 'btn-text', action: { name: 'submit' } } } },
      ]),
      createBeginRendering('btn-1'),
    ];

    render(
      <TestWrapper onAction={mockOnAction}>
        <TestRenderer messages={messages} />
      </TestWrapper>
    );

    fireEvent.click(screen.getByRole('button'));

    expect(mockOnAction).toHaveBeenCalledTimes(1);
    const event = getMockCallArg<Types.A2UIClientEventMessage>(mockOnAction, 0);
    expect(event.userAction).toBeDefined();
    expect(event.userAction?.name).toBe('submit');
  });

  it('should dispatch action with context parameters', () => {
    const mockOnAction = vi.fn();
    const messages: Types.ServerToClientMessage[] = [
      createSurfaceUpdate([
        { id: 'btn-text', component: { Text: { text: { literalString: 'Delete' } } } },
        {
          id: 'btn-1',
          component: {
            Button: {
              child: 'btn-text',
              action: {
                name: 'delete',
                context: [
                  { key: 'itemId', value: { literalString: 'item-123' } },
                  { key: 'confirmed', value: { literalBoolean: true } },
                ],
              },
            },
          },
        },
      ]),
      createBeginRendering('btn-1'),
    ];

    render(
      <TestWrapper onAction={mockOnAction}>
        <TestRenderer messages={messages} />
      </TestWrapper>
    );

    fireEvent.click(screen.getByRole('button'));

    expect(mockOnAction).toHaveBeenCalledTimes(1);
    const event = getMockCallArg<Types.A2UIClientEventMessage>(mockOnAction, 0);
    expect(event.userAction).toBeDefined();
    expect(event.userAction?.name).toBe('delete');
    expect(event.userAction?.context).toBeDefined();
  });

  it('should not call onAction if not provided', () => {
    const messages: Types.ServerToClientMessage[] = [
      createSurfaceUpdate([
        { id: 'btn-text', component: { Text: { text: { literalString: 'Click' } } } },
        { id: 'btn-1', component: { Button: { child: 'btn-text', action: { name: 'test' } } } },
      ]),
      createBeginRendering('btn-1'),
    ];

    render(
      <TestWrapper>
        <TestRenderer messages={messages} />
      </TestWrapper>
    );

    expect(() => {
      fireEvent.click(screen.getByRole('button'));
    }).not.toThrow();
  });

  it('should dispatch actions from different components', () => {
    const mockOnAction = vi.fn();
    const messages: Types.ServerToClientMessage[] = [
      createSurfaceUpdate([
        { id: 'btn1-text', component: { Text: { text: { literalString: 'Action 1' } } } },
        { id: 'btn1', component: { Button: { child: 'btn1-text', action: { name: 'action-1' } } } },
        { id: 'btn2-text', component: { Text: { text: { literalString: 'Action 2' } } } },
        { id: 'btn2', component: { Button: { child: 'btn2-text', action: { name: 'action-2' } } } },
        { id: 'col', component: { Column: { children: { explicitList: ['btn1', 'btn2'] } } } },
      ]),
      createBeginRendering('col'),
    ];

    render(
      <TestWrapper onAction={mockOnAction}>
        <TestRenderer messages={messages} />
      </TestWrapper>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Action 1' }));
    expect(mockOnAction).toHaveBeenCalledTimes(1);
    const event1 = getMockCallArg<Types.A2UIClientEventMessage>(mockOnAction, 0);
    expect(event1.userAction).toBeDefined();
    expect(event1.userAction?.name).toBe('action-1');

    fireEvent.click(screen.getByRole('button', { name: 'Action 2' }));
    expect(mockOnAction).toHaveBeenCalledTimes(2);
    const event2 = getMockCallArg<Types.A2UIClientEventMessage>(mockOnAction, 1);
    expect(event2.userAction).toBeDefined();
    expect(event2.userAction?.name).toBe('action-2');
  });
});
