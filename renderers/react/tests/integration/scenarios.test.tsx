/**
 * Integration Tests
 * Tests full A2UI protocol scenarios with streaming messages
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MessageProcessor } from '../../src/processor/MessageProcessor'
import { A2UISurface } from '../../src/surface/A2UISurface'
import type {
  BeginRenderingMessage,
  SurfaceUpdateMessage,
  DataModelUpdateMessage,
  DeleteSurfaceMessage,
} from '../../src/processor/types'
import type { A2UIAction } from '../../src/types'

// Import components to register them
import '../../src/components/index'

describe('Integration: Full Protocol Scenarios', () => {
  let processor: MessageProcessor

  beforeEach(() => {
    processor = new MessageProcessor()
  })

  // ===========================================================================
  // Scenario: Normal Message Order
  // ===========================================================================

  describe('Normal Message Order', () => {
    it('renders surface when messages arrive in order: begin → update → data', async () => {
      const { rerender } = render(
        <A2UISurface surfaceId="test-1" processor={processor} />
      )

      // 1. beginRendering
      processor.processMessage({
        type: 'beginRendering',
        surfaceId: 'test-1',
        root: 'root',
      } as BeginRenderingMessage)

      // 2. surfaceUpdate
      processor.processMessage({
        type: 'surfaceUpdate',
        surfaceId: 'test-1',
        components: [
          { id: 'root', component: { Column: { children: ['title', 'content'] } } },
          { id: 'title', component: { Text: { text: { path: '/title' }, usageHint: 'h1' } } },
          { id: 'content', component: { Text: { text: 'Static content' } } },
        ],
      } as SurfaceUpdateMessage)

      // 3. dataModelUpdate
      processor.processMessage({
        type: 'dataModelUpdate',
        surfaceId: 'test-1',
        contents: [
          { key: 'title', valueString: 'Welcome!' },
        ],
      } as DataModelUpdateMessage)

      rerender(<A2UISurface surfaceId="test-1" processor={processor} />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome!')
        expect(screen.getByText('Static content')).toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // Scenario: Buffering (Out-of-Order)
  // ===========================================================================

  describe('Buffering (Out-of-Order)', () => {
    it('buffers surfaceUpdate before beginRendering and renders correctly', async () => {
      const { rerender } = render(
        <A2UISurface surfaceId="flashcard-1" processor={processor} />
      )

      // 1. surfaceUpdate arrives FIRST (should be buffered)
      processor.processMessage({
        type: 'surfaceUpdate',
        surfaceId: 'flashcard-1',
        components: [
          { id: 'root', component: { Card: { child: 'word' } } },
          { id: 'word', component: { Text: { text: { path: '/card/word' }, usageHint: 'h2' } } },
        ],
      } as SurfaceUpdateMessage)

      // 2. dataModelUpdate arrives SECOND (also buffered)
      processor.processMessage({
        type: 'dataModelUpdate',
        surfaceId: 'flashcard-1',
        contents: [
          {
            key: 'card',
            valueMap: [
              { key: 'word', valueString: '日本語' },
            ],
          },
        ],
      } as DataModelUpdateMessage)

      // Surface should be in buffering state - show loading
      rerender(<A2UISurface surfaceId="flashcard-1" processor={processor} />)

      // 3. beginRendering arrives - flushes buffer
      processor.processMessage({
        type: 'beginRendering',
        surfaceId: 'flashcard-1',
        root: 'root',
      } as BeginRenderingMessage)

      rerender(<A2UISurface surfaceId="flashcard-1" processor={processor} />)

      await waitFor(() => {
        expect(screen.getByText('日本語')).toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // Scenario: Live Data Updates
  // ===========================================================================

  describe('Live Data Updates', () => {
    it('updates display when dataModelUpdate changes values', async () => {
      const { rerender } = render(
        <A2UISurface surfaceId="counter-1" processor={processor} />
      )

      // Setup
      processor.processMessage({
        type: 'beginRendering',
        surfaceId: 'counter-1',
        root: 'root',
      } as BeginRenderingMessage)

      processor.processMessage({
        type: 'surfaceUpdate',
        surfaceId: 'counter-1',
        components: [
          { id: 'root', component: { Text: { text: { path: '/count' }, usageHint: 'h1' } } },
        ],
      } as SurfaceUpdateMessage)

      processor.processMessage({
        type: 'dataModelUpdate',
        surfaceId: 'counter-1',
        contents: [{ key: 'count', valueString: '0' }],
      } as DataModelUpdateMessage)

      rerender(<A2UISurface surfaceId="counter-1" processor={processor} />)

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument()
      })

      // Update count to 5
      processor.processMessage({
        type: 'dataModelUpdate',
        surfaceId: 'counter-1',
        contents: [{ key: 'count', valueString: '5' }],
      } as DataModelUpdateMessage)

      rerender(<A2UISurface surfaceId="counter-1" processor={processor} />)

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // Scenario: Incremental Component Updates
  // ===========================================================================

  describe('Incremental Component Updates', () => {
    it('adds new components with subsequent surfaceUpdate messages', async () => {
      const { rerender } = render(
        <A2UISurface surfaceId="incremental-1" processor={processor} />
      )

      processor.processMessage({
        type: 'beginRendering',
        surfaceId: 'incremental-1',
        root: 'root',
      } as BeginRenderingMessage)

      // Initial: just a title
      processor.processMessage({
        type: 'surfaceUpdate',
        surfaceId: 'incremental-1',
        components: [
          { id: 'root', component: { Column: { children: ['title'] } } },
          { id: 'title', component: { Text: { text: 'Building...', usageHint: 'h2' } } },
        ],
      } as SurfaceUpdateMessage)

      rerender(<A2UISurface surfaceId="incremental-1" processor={processor} />)

      await waitFor(() => {
        expect(screen.getByText('Building...')).toBeInTheDocument()
      })

      // Add a card
      processor.processMessage({
        type: 'surfaceUpdate',
        surfaceId: 'incremental-1',
        components: [
          { id: 'root', component: { Column: { children: ['title', 'card'] } } },
          { id: 'card', component: { Card: { child: 'card-text' } } },
          { id: 'card-text', component: { Text: { text: 'New card!' } } },
        ],
      } as SurfaceUpdateMessage)

      rerender(<A2UISurface surfaceId="incremental-1" processor={processor} />)

      await waitFor(() => {
        expect(screen.getByText('Building...')).toBeInTheDocument()
        expect(screen.getByText('New card!')).toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // Scenario: Surface Lifecycle (Delete)
  // ===========================================================================

  describe('Surface Lifecycle', () => {
    it('surface returns null when deleted', async () => {
      const { rerender } = render(
        <A2UISurface surfaceId="temp-1" processor={processor} />
      )

      processor.processMessage({
        type: 'beginRendering',
        surfaceId: 'temp-1',
        root: 'root',
      } as BeginRenderingMessage)

      processor.processMessage({
        type: 'surfaceUpdate',
        surfaceId: 'temp-1',
        components: [
          { id: 'root', component: { Text: { text: 'Temporary Surface' } } },
        ],
      } as SurfaceUpdateMessage)

      rerender(<A2UISurface surfaceId="temp-1" processor={processor} />)

      await waitFor(() => {
        expect(screen.getByText('Temporary Surface')).toBeInTheDocument()
      })

      // Delete the surface
      processor.processMessage({
        type: 'deleteSurface',
        surfaceId: 'temp-1',
      } as DeleteSurfaceMessage)

      rerender(<A2UISurface surfaceId="temp-1" processor={processor} />)

      await waitFor(() => {
        expect(screen.queryByText('Temporary Surface')).not.toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // Scenario: Action Dispatch
  // ===========================================================================

  describe('Action Dispatch', () => {
    it('dispatches action when button is clicked', async () => {
      const onAction = vi.fn<(action: A2UIAction, surfaceId: string, sourceComponentId: string) => void>()

      const { rerender } = render(
        <A2UISurface surfaceId="action-1" processor={processor} onAction={onAction} />
      )

      processor.processMessage({
        type: 'beginRendering',
        surfaceId: 'action-1',
        root: 'root',
      } as BeginRenderingMessage)

      processor.processMessage({
        type: 'surfaceUpdate',
        surfaceId: 'action-1',
        components: [
          { id: 'root', component: { Button: { child: 'btn-text', action: { name: 'submit', context: { quality: 5 } } } } },
          { id: 'btn-text', component: { Text: { text: 'Submit' } } },
        ],
      } as SurfaceUpdateMessage)

      rerender(<A2UISurface surfaceId="action-1" processor={processor} onAction={onAction} />)

      await waitFor(() => {
        expect(screen.getByRole('button')).toHaveTextContent('Submit')
      })

      fireEvent.click(screen.getByRole('button'))

      // Action dispatch structure: (action, surfaceId, sourceComponentId)
      // Spec-compliant flat format
      expect(onAction).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'submit',
        }),
        'action-1', // surfaceId
        expect.any(String) // sourceComponentId
      )
    })
  })

  // ===========================================================================
  // Scenario: Japanese Content
  // ===========================================================================

  describe('Japanese Content', () => {
    it('renders Japanese text correctly with all character types', async () => {
      const { rerender } = render(
        <A2UISurface surfaceId="jp-1" processor={processor} />
      )

      processor.processMessage({
        type: 'beginRendering',
        surfaceId: 'jp-1',
        root: 'root',
      } as BeginRenderingMessage)

      processor.processMessage({
        type: 'surfaceUpdate',
        surfaceId: 'jp-1',
        components: [
          { id: 'root', component: { Column: { children: ['kanji', 'hiragana', 'katakana'] } } },
          { id: 'kanji', component: { Text: { text: '日本語', usageHint: 'h2' } } },
          { id: 'hiragana', component: { Text: { text: 'にほんご', usageHint: 'h3' } } },
          { id: 'katakana', component: { Text: { text: 'ニホンゴ' } } },
        ],
      } as SurfaceUpdateMessage)

      rerender(<A2UISurface surfaceId="jp-1" processor={processor} />)

      await waitFor(() => {
        expect(screen.getByText('日本語')).toBeInTheDocument()
        expect(screen.getByText('にほんご')).toBeInTheDocument()
        expect(screen.getByText('ニホンゴ')).toBeInTheDocument()
      })
    })
  })
})
