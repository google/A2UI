import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React, { useEffect } from 'react';
import { A2UIProvider, A2UIRenderer, useA2UI, useA2UIActions } from '../src';
import type { Types } from '@a2ui/lit/0.8';
import {
  TestWrapper,
  TestRenderer,
  createSurfaceUpdate,
  createBeginRendering,
  createDataModelUpdate,
  createDeleteSurface,
} from './helpers';

/**
 * Server-Client Communication Tests
 *
 * These tests verify the core communication mechanisms between server messages
 * and the React renderer, including:
 * - Message processing (surfaceUpdate, beginRendering)
 * - Multiple surfaces
 * - Data model operations (setData, getData)
 * - Path bindings and resolution
 * - Component updates and removal
 * - Action dispatch
 */

describe('Server-Client Communication', () => {
  describe('Message Processing', () => {
    it('should process surfaceUpdate and beginRendering messages', () => {
      const messages: Types.ServerToClientMessage[] = [
        createSurfaceUpdate([
          { id: 'text-1', component: { Text: { text: { literalString: 'Hello World' } } } },
        ]),
        createBeginRendering('text-1'),
      ];

      render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('should process multiple messages in sequence', () => {
      // Helper component that processes messages in sequence
      function SequentialRenderer() {
        const { processMessages } = useA2UI();

        useEffect(() => {
          // First batch: create initial component
          processMessages([
            createSurfaceUpdate([
              { id: 'text-1', component: { Text: { text: { literalString: 'Initial' } } } },
            ]),
            createBeginRendering('text-1'),
          ]);

          // Second batch: update the component
          processMessages([
            createSurfaceUpdate([
              { id: 'text-1', component: { Text: { text: { literalString: 'Updated' } } } },
            ]),
            createBeginRendering('text-1'),
          ]);
        }, [processMessages]);

        return <A2UIRenderer surfaceId="@default" />;
      }

      render(
        <A2UIProvider>
          <SequentialRenderer />
        </A2UIProvider>
      );

      // Should show the updated text, not the initial
      expect(screen.getByText('Updated')).toBeInTheDocument();
      expect(screen.queryByText('Initial')).not.toBeInTheDocument();
    });

    it('should handle empty message arrays gracefully', () => {
      function EmptyMessagesRenderer() {
        const { processMessages } = useA2UI();

        useEffect(() => {
          // Process empty array
          processMessages([]);

          // Then process actual content
          processMessages([
            createSurfaceUpdate([
              { id: 'text-1', component: { Text: { text: { literalString: 'After empty' } } } },
            ]),
            createBeginRendering('text-1'),
          ]);
        }, [processMessages]);

        return <A2UIRenderer surfaceId="@default" />;
      }

      render(
        <A2UIProvider>
          <EmptyMessagesRenderer />
        </A2UIProvider>
      );

      expect(screen.getByText('After empty')).toBeInTheDocument();
    });
  });

  describe('Multiple Surfaces', () => {
    it('should render different content on different surfaces', () => {
      function MultiSurfaceRenderer() {
        const { processMessages } = useA2UI();

        useEffect(() => {
          processMessages([
            // Surface A
            createSurfaceUpdate(
              [{ id: 'text-a', component: { Text: { text: { literalString: 'Surface A Content' } } } }],
              'surface-a'
            ),
            createBeginRendering('text-a', 'surface-a'),
            // Surface B
            createSurfaceUpdate(
              [{ id: 'text-b', component: { Text: { text: { literalString: 'Surface B Content' } } } }],
              'surface-b'
            ),
            createBeginRendering('text-b', 'surface-b'),
          ]);
        }, [processMessages]);

        return (
          <>
            <div data-testid="surface-a">
              <A2UIRenderer surfaceId="surface-a" />
            </div>
            <div data-testid="surface-b">
              <A2UIRenderer surfaceId="surface-b" />
            </div>
          </>
        );
      }

      render(
        <A2UIProvider>
          <MultiSurfaceRenderer />
        </A2UIProvider>
      );

      expect(screen.getByText('Surface A Content')).toBeInTheDocument();
      expect(screen.getByText('Surface B Content')).toBeInTheDocument();

      // Verify they're in the correct containers
      const surfaceA = screen.getByTestId('surface-a');
      const surfaceB = screen.getByTestId('surface-b');
      expect(surfaceA).toContainElement(screen.getByText('Surface A Content'));
      expect(surfaceB).toContainElement(screen.getByText('Surface B Content'));
    });

    it('should update surfaces independently', () => {
      function IndependentSurfaceRenderer() {
        const { processMessages } = useA2UI();
        const [step, setStep] = React.useState(0);

        useEffect(() => {
          if (step === 0) {
            // Initial setup
            processMessages([
              createSurfaceUpdate(
                [{ id: 'text-a', component: { Text: { text: { literalString: 'A: Initial' } } } }],
                'surface-a'
              ),
              createBeginRendering('text-a', 'surface-a'),
              createSurfaceUpdate(
                [{ id: 'text-b', component: { Text: { text: { literalString: 'B: Initial' } } } }],
                'surface-b'
              ),
              createBeginRendering('text-b', 'surface-b'),
            ]);
            setStep(1);
          } else if (step === 1) {
            // Update only surface A
            processMessages([
              createSurfaceUpdate(
                [{ id: 'text-a', component: { Text: { text: { literalString: 'A: Updated' } } } }],
                'surface-a'
              ),
              createBeginRendering('text-a', 'surface-a'),
            ]);
          }
        }, [processMessages, step]);

        return (
          <>
            <A2UIRenderer surfaceId="surface-a" />
            <A2UIRenderer surfaceId="surface-b" />
          </>
        );
      }

      render(
        <A2UIProvider>
          <IndependentSurfaceRenderer />
        </A2UIProvider>
      );

      // Surface A should be updated
      expect(screen.getByText('A: Updated')).toBeInTheDocument();
      // Surface B should remain unchanged
      expect(screen.getByText('B: Initial')).toBeInTheDocument();
    });

    it('should render nothing for non-existent surface', () => {
      render(
        <A2UIProvider>
          <A2UIRenderer surfaceId="does-not-exist" />
        </A2UIProvider>
      );

      // Should render without error but with no content
      // The surface container should exist but be empty
    });
  });

  describe('Component Updates', () => {
    it('should update component props when new message received', () => {
      function UpdateRenderer() {
        const { processMessages } = useA2UI();
        const [updated, setUpdated] = React.useState(false);

        useEffect(() => {
          // Initial render
          processMessages([
            createSurfaceUpdate([
              { id: 'text-1', component: { Text: { text: { literalString: 'Before' } } } },
            ]),
            createBeginRendering('text-1'),
          ]);

          // Schedule update
          setTimeout(() => {
            processMessages([
              createSurfaceUpdate([
                { id: 'text-1', component: { Text: { text: { literalString: 'After' } } } },
              ]),
              createBeginRendering('text-1'),
            ]);
            setUpdated(true);
          }, 10);
        }, [processMessages]);

        return <A2UIRenderer surfaceId="@default" />;
      }

      render(
        <A2UIProvider>
          <UpdateRenderer />
        </A2UIProvider>
      );

      // Initially shows "Before"
      expect(screen.getByText('Before')).toBeInTheDocument();

      // After update shows "After"
      return waitFor(() => {
        expect(screen.getByText('After')).toBeInTheDocument();
      });
    });

    it('should handle component type change', () => {
      function TypeChangeRenderer() {
        const { processMessages } = useA2UI();

        useEffect(() => {
          // Start with Text
          processMessages([
            createSurfaceUpdate([
              { id: 'comp-1', component: { Text: { text: { literalString: 'I am text' } } } },
            ]),
            createBeginRendering('comp-1'),
          ]);

          // Change to Button
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

      // Initially shows text
      expect(screen.getByText('I am text')).toBeInTheDocument();

      // After update shows button
      return waitFor(() => {
        expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
      });
    });

    it('should add new components to existing surface', () => {
      function AddComponentRenderer() {
        const { processMessages } = useA2UI();

        useEffect(() => {
          // Initial with one component
          processMessages([
            createSurfaceUpdate([
              { id: 'text-1', component: { Text: { text: { literalString: 'First' } } } },
            ]),
            createBeginRendering('text-1'),
          ]);

          // Add second component in a column
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

  describe('dataModelUpdate Messages', () => {
    it('should initialize data model via dataModelUpdate before rendering', () => {
      // Per A2UI spec: dataModelUpdate modifies application state independently of UI
      // Components with path bindings should read from the data model
      function DataModelRenderer() {
        const { processMessages } = useA2UI();

        useEffect(() => {
          processMessages([
            // First, update the data model
            createDataModelUpdate([
              { key: 'greeting', value: 'Hello from data model' },
            ]),
            // Then create UI that reads from it
            createSurfaceUpdate([
              {
                id: 'text-1',
                component: {
                  Text: { text: { path: 'greeting' } },
                },
              },
            ]),
            createBeginRendering('text-1'),
          ]);
        }, [processMessages]);

        return <A2UIRenderer surfaceId="@default" />;
      }

      render(
        <A2UIProvider>
          <DataModelRenderer />
        </A2UIProvider>
      );

      // Text should display the value from data model
      expect(screen.getByText('Hello from data model')).toBeInTheDocument();
    });

    it('should update existing data model values', async () => {
      // Per A2UI spec: dataModelUpdate can update existing values
      function DataUpdateRenderer() {
        const { processMessages } = useA2UI();
        const [step, setStep] = React.useState(0);

        useEffect(() => {
          if (step === 0) {
            processMessages([
              createDataModelUpdate([{ key: 'counter', value: 'Count: 0' }]),
              createSurfaceUpdate([
                { id: 'text-1', component: { Text: { text: { path: 'counter' } } } },
              ]),
              createBeginRendering('text-1'),
            ]);
            setStep(1);
          } else if (step === 1) {
            // Update the data model value
            setTimeout(() => {
              processMessages([
                createDataModelUpdate([{ key: 'counter', value: 'Count: 1' }]),
              ]);
            }, 10);
          }
        }, [processMessages, step]);

        return <A2UIRenderer surfaceId="@default" />;
      }

      render(
        <A2UIProvider>
          <DataUpdateRenderer />
        </A2UIProvider>
      );

      // Should eventually show updated value
      await waitFor(() => {
        expect(screen.getByText('Count: 1')).toBeInTheDocument();
      });
    });
  });

  describe('deleteSurface Messages', () => {
    it('should remove surface content when deleteSurface is received', async () => {
      // Per A2UI spec: deleteSurface removes a UI surface and associated content
      function DeleteSurfaceRenderer() {
        const { processMessages } = useA2UI();
        const [deleted, setDeleted] = React.useState(false);

        useEffect(() => {
          processMessages([
            createSurfaceUpdate(
              [{ id: 'text-1', component: { Text: { text: { literalString: 'Surface content' } } } }],
              'deletable-surface'
            ),
            createBeginRendering('text-1', 'deletable-surface'),
          ]);

          setTimeout(() => {
            processMessages([createDeleteSurface('deletable-surface')]);
            setDeleted(true);
          }, 10);
        }, [processMessages]);

        return (
          <>
            <A2UIRenderer surfaceId="deletable-surface" />
            {deleted && <span data-testid="deleted-marker">Deleted</span>}
          </>
        );
      }

      render(
        <A2UIProvider>
          <DeleteSurfaceRenderer />
        </A2UIProvider>
      );

      // Initially shows content
      expect(screen.getByText('Surface content')).toBeInTheDocument();

      // After deleteSurface, content should be gone
      await waitFor(() => {
        expect(screen.getByTestId('deleted-marker')).toBeInTheDocument();
        expect(screen.queryByText('Surface content')).not.toBeInTheDocument();
      });
    });
  });

  describe('Path Bindings', () => {
    it('should propagate data changes across components sharing the same path', async () => {
      // Per A2UI spec: Components use BoundValue paths to access current state
      // When one component writes to a path, others reading it should update
      // This tests the data model round-trip: input -> setData -> path resolution -> display
      function SharedDataRenderer() {
        const { processMessages } = useA2UI();

        useEffect(() => {
          processMessages([
            createSurfaceUpdate([
              // TextField writes to the path
              {
                id: 'tf-1',
                component: {
                  TextField: {
                    text: { path: 'shared.name' },
                    label: { literalString: 'Name' },
                  },
                },
              },
              // Text reads from the same path
              {
                id: 'text-1',
                component: {
                  Text: { text: { path: 'shared.name' } },
                },
              },
              // Layout
              {
                id: 'col-1',
                component: {
                  Column: { children: { explicitList: ['tf-1', 'text-1'] } },
                },
              },
            ]),
            createBeginRendering('col-1'),
          ]);
        }, [processMessages]);

        return <A2UIRenderer surfaceId="@default" />;
      }

      const { container } = render(
        <A2UIProvider>
          <SharedDataRenderer />
        </A2UIProvider>
      );

      const input = container.querySelector('input');
      expect(input).toBeInTheDocument();

      // Type a value - TextField updates the data model at 'shared.name'
      fireEvent.change(input!, { target: { value: 'Alice' } });

      // Per spec: Text component reading from 'shared.name' should display updated value
      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
      });
    });

    it('should handle TextField value binding', () => {
      const messages: Types.ServerToClientMessage[] = [
        createSurfaceUpdate([
          {
            id: 'tf-1',
            component: {
              TextField: {
                value: { path: 'form.username' },
                label: { literalString: 'Username' },
              },
            },
          },
        ]),
        createBeginRendering('tf-1'),
      ];

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const input = container.querySelector('input');
      expect(input).toBeInTheDocument();

      // Type in the field
      fireEvent.change(input!, { target: { value: 'testuser' } });

      // Value should be updated
      expect(input).toHaveValue('testuser');
    });

    it('should handle CheckBox checked binding via path', () => {
      const messages: Types.ServerToClientMessage[] = [
        createSurfaceUpdate([
          {
            id: 'cb-1',
            component: {
              CheckBox: {
                value: { path: 'form.agree' },
                label: { literalString: 'I agree' },
              },
            },
          },
        ]),
        createBeginRendering('cb-1'),
      ];

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox).toBeInTheDocument();

      // Initially unchecked (no data set)
      expect(checkbox.checked).toBe(false);

      // Click to check
      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });
  });

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
      expect(mockOnAction.mock.calls[0][0].userAction.name).toBe('submit');
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
      const action = mockOnAction.mock.calls[0][0].userAction;
      expect(action.name).toBe('delete');
      expect(action.context).toBeDefined();
    });

    it('should not call onAction if not provided', () => {
      const messages: Types.ServerToClientMessage[] = [
        createSurfaceUpdate([
          { id: 'btn-text', component: { Text: { text: { literalString: 'Click' } } } },
          { id: 'btn-1', component: { Button: { child: 'btn-text', action: { name: 'test' } } } },
        ]),
        createBeginRendering('btn-1'),
      ];

      // No onAction provided - should not throw
      render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      // Should not throw when clicking
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

      // Click first button
      fireEvent.click(screen.getByRole('button', { name: 'Action 1' }));
      expect(mockOnAction).toHaveBeenCalledTimes(1);
      expect(mockOnAction.mock.calls[0][0].userAction.name).toBe('action-1');

      // Click second button
      fireEvent.click(screen.getByRole('button', { name: 'Action 2' }));
      expect(mockOnAction).toHaveBeenCalledTimes(2);
      expect(mockOnAction.mock.calls[1][0].userAction.name).toBe('action-2');
    });
  });

  describe('Clear Surfaces', () => {
    it('should clear all surfaces when clearSurfaces is called', () => {
      function ClearRenderer() {
        const { processMessages, clearSurfaces } = useA2UI();
        const [cleared, setCleared] = React.useState(false);

        useEffect(() => {
          processMessages([
            createSurfaceUpdate([
              { id: 'text-1', component: { Text: { text: { literalString: 'Will be cleared' } } } },
            ]),
            createBeginRendering('text-1'),
          ]);

          setTimeout(() => {
            clearSurfaces();
            setCleared(true);
          }, 10);
        }, [processMessages, clearSurfaces]);

        return (
          <>
            <A2UIRenderer surfaceId="@default" />
            {cleared && <span data-testid="cleared-marker">Cleared</span>}
          </>
        );
      }

      render(
        <A2UIProvider>
          <ClearRenderer />
        </A2UIProvider>
      );

      // Initially shows content
      expect(screen.getByText('Will be cleared')).toBeInTheDocument();

      // After clear, content is gone
      return waitFor(() => {
        expect(screen.getByTestId('cleared-marker')).toBeInTheDocument();
        expect(screen.queryByText('Will be cleared')).not.toBeInTheDocument();
      });
    });

    it('should allow new content after clearing', () => {
      function ClearAndRefillRenderer() {
        const { processMessages, clearSurfaces } = useA2UI();
        const [step, setStep] = React.useState(0);

        useEffect(() => {
          if (step === 0) {
            processMessages([
              createSurfaceUpdate([
                { id: 'text-1', component: { Text: { text: { literalString: 'Original' } } } },
              ]),
              createBeginRendering('text-1'),
            ]);
            setStep(1);
          } else if (step === 1) {
            clearSurfaces();
            setStep(2);
          } else if (step === 2) {
            processMessages([
              createSurfaceUpdate([
                { id: 'text-2', component: { Text: { text: { literalString: 'New Content' } } } },
              ]),
              createBeginRendering('text-2'),
            ]);
          }
        }, [processMessages, clearSurfaces, step]);

        return <A2UIRenderer surfaceId="@default" />;
      }

      render(
        <A2UIProvider>
          <ClearAndRefillRenderer />
        </A2UIProvider>
      );

      return waitFor(() => {
        expect(screen.getByText('New Content')).toBeInTheDocument();
        expect(screen.queryByText('Original')).not.toBeInTheDocument();
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

      // Verify nesting structure
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
      // The message processor validates data and throws on invalid input
      // This is expected behavior - invalid messages should fail fast
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const messages: Types.ServerToClientMessage[] = [
        createSurfaceUpdate([
          // Button references non-existent child - processor validates this
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

  describe('Context Hooks', () => {
    it('should throw error when useA2UI is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      function BadComponent() {
        useA2UI();
        return null;
      }

      expect(() => {
        render(<BadComponent />);
      }).toThrow();

      consoleSpy.mockRestore();
    });

    it('should provide stable action references across renders', () => {
      const actionRefs: Array<ReturnType<typeof useA2UI>> = [];

      function ActionTracker() {
        const api = useA2UI();
        actionRefs.push(api);

        return (
          <button onClick={() => api.processMessages([])}>Trigger</button>
        );
      }

      const { rerender } = render(
        <A2UIProvider>
          <ActionTracker />
        </A2UIProvider>
      );

      // Trigger re-render
      rerender(
        <A2UIProvider>
          <ActionTracker />
        </A2UIProvider>
      );

      // processMessages should be the same reference
      expect(actionRefs[0].processMessages).toBe(actionRefs[1].processMessages);
    });
  });
});
