import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React, { useEffect } from 'react';
import { A2UIProvider, A2UIRenderer, useA2UI } from '../../src';
import type { Types } from '@a2ui/lit/0.8';
import {
  TestWrapper,
  TestRenderer,
  createSurfaceUpdate,
  createBeginRendering,
  createDeleteSurface,
} from '../utils';

/**
 * Message Processing Integration Tests
 *
 * Tests for core message processing, multiple surfaces, surface deletion,
 * and surface clearing functionality.
 */

describe('Message Processing', () => {
  describe('Basic Processing', () => {
    it('should not render surface until beginRendering is received', () => {
      function StagedRenderer() {
        const { processMessages } = useA2UI();
        const [stage, setStage] = React.useState<'initial' | 'updated' | 'rendering'>('initial');

        useEffect(() => {
          if (stage === 'initial') {
            // Step 1: Only send surfaceUpdate (no beginRendering)
            processMessages([
              createSurfaceUpdate([
                { id: 'text-1', component: { Text: { text: { literalString: 'Should not appear yet' } } } },
              ]),
            ]);
            setStage('updated');
          } else if (stage === 'updated') {
            // Give React a chance to render, then send beginRendering
            setTimeout(() => {
              processMessages([createBeginRendering('text-1')]);
              setStage('rendering');
            }, 10);
          }
        }, [processMessages, stage]);

        return (
          <>
            <A2UIRenderer surfaceId="@default" />
            <span data-testid="stage">{stage}</span>
          </>
        );
      }

      render(
        <A2UIProvider>
          <StagedRenderer />
        </A2UIProvider>
      );

      // After surfaceUpdate only, content should NOT be visible
      expect(screen.getByTestId('stage')).toHaveTextContent('updated');
      expect(screen.queryByText('Should not appear yet')).not.toBeInTheDocument();

      // After beginRendering, content should be visible
      return waitFor(() => {
        expect(screen.getByTestId('stage')).toHaveTextContent('rendering');
        expect(screen.getByText('Should not appear yet')).toBeInTheDocument();
      });
    });

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
      function SequentialRenderer() {
        const { processMessages } = useA2UI();

        useEffect(() => {
          processMessages([
            createSurfaceUpdate([
              { id: 'text-1', component: { Text: { text: { literalString: 'Initial' } } } },
            ]),
            createBeginRendering('text-1'),
          ]);

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

      expect(screen.getByText('Updated')).toBeInTheDocument();
      expect(screen.queryByText('Initial')).not.toBeInTheDocument();
    });

    it('should handle empty message arrays gracefully', () => {
      function EmptyMessagesRenderer() {
        const { processMessages } = useA2UI();

        useEffect(() => {
          processMessages([]);
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
            createSurfaceUpdate(
              [{ id: 'text-a', component: { Text: { text: { literalString: 'Surface A Content' } } } }],
              'surface-a'
            ),
            createBeginRendering('text-a', 'surface-a'),
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

      expect(screen.getByText('A: Updated')).toBeInTheDocument();
      expect(screen.getByText('B: Initial')).toBeInTheDocument();
    });

    it('should render nothing for non-existent surface', () => {
      render(
        <A2UIProvider>
          <A2UIRenderer surfaceId="does-not-exist" />
        </A2UIProvider>
      );
      // Should render without error but with no content
    });
  });

  describe('Delete Surface', () => {
    it('should remove surface content when deleteSurface is received', async () => {
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

      expect(screen.getByText('Surface content')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId('deleted-marker')).toBeInTheDocument();
        expect(screen.queryByText('Surface content')).not.toBeInTheDocument();
      });
    });

    it('should handle deleting a non-existent surface gracefully', () => {
      function DeleteNonExistentRenderer() {
        const { processMessages } = useA2UI();
        const [attempted, setAttempted] = React.useState(false);

        useEffect(() => {
          // Try to delete a surface that was never created
          processMessages([createDeleteSurface('does-not-exist')]);
          setAttempted(true);
        }, [processMessages]);

        return <span data-testid="status">{attempted ? 'completed' : 'pending'}</span>;
      }

      // Should not throw an error
      render(
        <A2UIProvider>
          <DeleteNonExistentRenderer />
        </A2UIProvider>
      );

      expect(screen.getByTestId('status')).toHaveTextContent('completed');
    });

    it('should only delete the specified surface, leaving others intact', async () => {
      function MultiSurfaceDeleteRenderer() {
        const { processMessages } = useA2UI();
        const [deleted, setDeleted] = React.useState(false);

        useEffect(() => {
          // Create two surfaces
          processMessages([
            createSurfaceUpdate(
              [{ id: 'text-a', component: { Text: { text: { literalString: 'Surface A content' } } } }],
              'surface-a'
            ),
            createBeginRendering('text-a', 'surface-a'),
            createSurfaceUpdate(
              [{ id: 'text-b', component: { Text: { text: { literalString: 'Surface B content' } } } }],
              'surface-b'
            ),
            createBeginRendering('text-b', 'surface-b'),
          ]);

          setTimeout(() => {
            // Delete only surface-a
            processMessages([createDeleteSurface('surface-a')]);
            setDeleted(true);
          }, 10);
        }, [processMessages]);

        return (
          <>
            <A2UIRenderer surfaceId="surface-a" />
            <A2UIRenderer surfaceId="surface-b" />
            {deleted && <span data-testid="deleted-marker">Deleted</span>}
          </>
        );
      }

      render(
        <A2UIProvider>
          <MultiSurfaceDeleteRenderer />
        </A2UIProvider>
      );

      // Both surfaces should be visible initially
      expect(screen.getByText('Surface A content')).toBeInTheDocument();
      expect(screen.getByText('Surface B content')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId('deleted-marker')).toBeInTheDocument();
        // Surface A should be gone, Surface B should remain
        expect(screen.queryByText('Surface A content')).not.toBeInTheDocument();
        expect(screen.getByText('Surface B content')).toBeInTheDocument();
      });
    });

    it('should allow re-creating a surface after deletion with the same ID', async () => {
      function RecreateAfterDeleteRenderer() {
        const { processMessages } = useA2UI();
        const [stage, setStage] = React.useState<'initial' | 'deleted' | 'recreated'>('initial');

        useEffect(() => {
          if (stage === 'initial') {
            // Create surface
            processMessages([
              createSurfaceUpdate(
                [{ id: 'text-1', component: { Text: { text: { literalString: 'Original content' } } } }],
                'recyclable-surface'
              ),
              createBeginRendering('text-1', 'recyclable-surface'),
            ]);
            setTimeout(() => setStage('deleted'), 10);
          } else if (stage === 'deleted') {
            // Delete surface
            processMessages([createDeleteSurface('recyclable-surface')]);
            setTimeout(() => setStage('recreated'), 10);
          } else if (stage === 'recreated') {
            // Re-create surface with same ID but different content
            processMessages([
              createSurfaceUpdate(
                [{ id: 'text-2', component: { Text: { text: { literalString: 'New content after recreation' } } } }],
                'recyclable-surface'
              ),
              createBeginRendering('text-2', 'recyclable-surface'),
            ]);
          }
        }, [processMessages, stage]);

        return (
          <>
            <A2UIRenderer surfaceId="recyclable-surface" />
            <span data-testid="stage">{stage}</span>
          </>
        );
      }

      render(
        <A2UIProvider>
          <RecreateAfterDeleteRenderer />
        </A2UIProvider>
      );

      // Initial content should be visible
      expect(screen.getByText('Original content')).toBeInTheDocument();

      // After deletion and recreation, new content should be visible
      await waitFor(() => {
        expect(screen.getByTestId('stage')).toHaveTextContent('recreated');
        expect(screen.queryByText('Original content')).not.toBeInTheDocument();
        expect(screen.getByText('New content after recreation')).toBeInTheDocument();
      });
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

      expect(screen.getByText('Will be cleared')).toBeInTheDocument();

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
});
