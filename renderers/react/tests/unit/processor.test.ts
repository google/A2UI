/**
 * MessageProcessor Unit Tests
 * Tests the central state machine for A2UI protocol message processing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MessageProcessor } from '../../src/processor/MessageProcessor'
import type {
  BeginRenderingMessage,
  SurfaceUpdateMessage,
  DataModelUpdateMessage,
  DeleteSurfaceMessage,
} from '../../src/processor/types'

describe('MessageProcessor', () => {
  let processor: MessageProcessor

  beforeEach(() => {
    processor = new MessageProcessor()
  })

  // ===========================================================================
  // beginRendering Tests
  // ===========================================================================

  describe('beginRendering', () => {
    it('creates a new surface with ready status', () => {
      const msg: BeginRenderingMessage = {
        type: 'beginRendering',
        surfaceId: 'test-1',
        root: 'root-component',
      }

      processor.processMessage(msg)

      const surface = processor.getSurface('test-1')
      expect(surface).toBeDefined()
      expect(surface?.status).toBe('ready')
      expect(surface?.rootId).toBe('root-component')
      expect(surface?.surfaceId).toBe('test-1')
    })

    it('uses default catalog ID when not specified', () => {
      const msg: BeginRenderingMessage = {
        type: 'beginRendering',
        surfaceId: 'test-1',
        root: 'root',
      }

      processor.processMessage(msg)

      const surface = processor.getSurface('test-1')
      expect(surface?.catalogId).toBe('https://a2ui.org/catalog/standard/v0.8')
    })

    it('uses custom catalog ID when specified', () => {
      const msg: BeginRenderingMessage = {
        type: 'beginRendering',
        surfaceId: 'test-1',
        root: 'root',
        catalogId: 'https://custom.catalog/v1.0',
      }

      processor.processMessage(msg)

      const surface = processor.getSurface('test-1')
      expect(surface?.catalogId).toBe('https://custom.catalog/v1.0')
    })

    it('preserves existing components when surface already exists', () => {
      // First, create surface with components
      processor.processMessage({
        type: 'beginRendering',
        surfaceId: 'test-1',
        root: 'root',
      } as BeginRenderingMessage)

      processor.processMessage({
        type: 'surfaceUpdate',
        surfaceId: 'test-1',
        components: [
          { id: 'comp1', component: { Text: { text: 'Hello' } } },
        ],
      } as SurfaceUpdateMessage)

      // Re-send beginRendering
      processor.processMessage({
        type: 'beginRendering',
        surfaceId: 'test-1',
        root: 'new-root',
      } as BeginRenderingMessage)

      const surface = processor.getSurface('test-1')
      expect(surface?.rootId).toBe('new-root')
      expect(surface?.components.get('comp1')).toBeDefined()
    })
  })

  // ===========================================================================
  // surfaceUpdate Tests
  // ===========================================================================

  describe('surfaceUpdate', () => {
    it('adds components to existing surface', () => {
      processor.processMessage({
        type: 'beginRendering',
        surfaceId: 'test-1',
        root: 'root',
      } as BeginRenderingMessage)

      processor.processMessage({
        type: 'surfaceUpdate',
        surfaceId: 'test-1',
        components: [
          { id: 'text1', component: { Text: { text: 'Hello' } } },
          { id: 'btn1', component: { Button: { child: 'text1' } } },
        ],
      } as SurfaceUpdateMessage)

      const surface = processor.getSurface('test-1')
      expect(surface?.components.size).toBe(2)
      expect(surface?.components.get('text1')?.type).toBe('Text')
      expect(surface?.components.get('btn1')?.type).toBe('Button')
    })

    it('updates existing components', () => {
      processor.processMessage({
        type: 'beginRendering',
        surfaceId: 'test-1',
        root: 'root',
      } as BeginRenderingMessage)

      processor.processMessage({
        type: 'surfaceUpdate',
        surfaceId: 'test-1',
        components: [
          { id: 'text1', component: { Text: { text: 'Hello' } } },
        ],
      } as SurfaceUpdateMessage)

      processor.processMessage({
        type: 'surfaceUpdate',
        surfaceId: 'test-1',
        components: [
          { id: 'text1', component: { Text: { text: 'Updated' } } },
        ],
      } as SurfaceUpdateMessage)

      const surface = processor.getSurface('test-1')
      expect(surface?.components.get('text1')?.props.text).toBe('Updated')
    })

    it('buffers updates when beginRendering not yet received', () => {
      // Send surfaceUpdate BEFORE beginRendering
      processor.processMessage({
        type: 'surfaceUpdate',
        surfaceId: 'test-1',
        components: [
          { id: 'text1', component: { Text: { text: 'Buffered' } } },
        ],
      } as SurfaceUpdateMessage)

      // Surface should exist but be buffering
      let surface = processor.getSurface('test-1')
      expect(surface?.status).toBe('buffering')
      expect(surface?.components.size).toBe(0) // Not applied yet

      // Now send beginRendering - should flush buffer
      processor.processMessage({
        type: 'beginRendering',
        surfaceId: 'test-1',
        root: 'text1',
      } as BeginRenderingMessage)

      surface = processor.getSurface('test-1')
      expect(surface?.status).toBe('ready')
      expect(surface?.components.size).toBe(1)
      expect(surface?.components.get('text1')?.props.text).toBe('Buffered')
    })
  })

  // ===========================================================================
  // dataModelUpdate Tests
  // ===========================================================================

  describe('dataModelUpdate', () => {
    it('sets simple string values', () => {
      processor.processMessage({
        type: 'beginRendering',
        surfaceId: 'test-1',
        root: 'root',
      } as BeginRenderingMessage)

      processor.processMessage({
        type: 'dataModelUpdate',
        surfaceId: 'test-1',
        contents: [
          { key: 'name', valueString: 'John' },
          { key: 'greeting', valueString: 'Hello' },
        ],
      } as DataModelUpdateMessage)

      const surface = processor.getSurface('test-1')
      expect(surface?.dataModel.get('name')).toBe('John')
      expect(surface?.dataModel.get('greeting')).toBe('Hello')
    })

    it('sets number values', () => {
      processor.processMessage({
        type: 'beginRendering',
        surfaceId: 'test-1',
        root: 'root',
      } as BeginRenderingMessage)

      processor.processMessage({
        type: 'dataModelUpdate',
        surfaceId: 'test-1',
        contents: [
          { key: 'count', valueNumber: 42 },
          { key: 'price', valueNumber: 19.99 },
        ],
      } as DataModelUpdateMessage)

      const surface = processor.getSurface('test-1')
      expect(surface?.dataModel.get('count')).toBe(42)
      expect(surface?.dataModel.get('price')).toBe(19.99)
    })

    it('sets boolean values', () => {
      processor.processMessage({
        type: 'beginRendering',
        surfaceId: 'test-1',
        root: 'root',
      } as BeginRenderingMessage)

      processor.processMessage({
        type: 'dataModelUpdate',
        surfaceId: 'test-1',
        contents: [
          { key: 'enabled', valueBoolean: true },
          { key: 'disabled', valueBoolean: false },
        ],
      } as DataModelUpdateMessage)

      const surface = processor.getSurface('test-1')
      expect(surface?.dataModel.get('enabled')).toBe(true)
      expect(surface?.dataModel.get('disabled')).toBe(false)
    })

    it('sets nested map values', () => {
      processor.processMessage({
        type: 'beginRendering',
        surfaceId: 'test-1',
        root: 'root',
      } as BeginRenderingMessage)

      processor.processMessage({
        type: 'dataModelUpdate',
        surfaceId: 'test-1',
        contents: [
          {
            key: 'user',
            valueMap: [
              { key: 'name', valueString: 'John' },
              { key: 'age', valueNumber: 30 },
            ],
          },
        ],
      } as DataModelUpdateMessage)

      const surface = processor.getSurface('test-1')
      const user = surface?.dataModel.get('user') as Record<string, unknown>
      expect(user.name).toBe('John')
      expect(user.age).toBe(30)
    })

    it('uses path prefix when specified', () => {
      processor.processMessage({
        type: 'beginRendering',
        surfaceId: 'test-1',
        root: 'root',
      } as BeginRenderingMessage)

      processor.processMessage({
        type: 'dataModelUpdate',
        surfaceId: 'test-1',
        path: '/settings',
        contents: [
          { key: 'theme', valueString: 'dark' },
        ],
      } as DataModelUpdateMessage)

      const surface = processor.getSurface('test-1')
      expect(surface?.dataModel.get('/settings/theme')).toBe('dark')
    })

    it('buffers data updates when beginRendering not yet received', () => {
      processor.processMessage({
        type: 'dataModelUpdate',
        surfaceId: 'test-1',
        contents: [
          { key: 'name', valueString: 'Buffered' },
        ],
      } as DataModelUpdateMessage)

      let surface = processor.getSurface('test-1')
      expect(surface?.status).toBe('buffering')
      expect(surface?.dataModel.size).toBe(0)

      processor.processMessage({
        type: 'beginRendering',
        surfaceId: 'test-1',
        root: 'root',
      } as BeginRenderingMessage)

      surface = processor.getSurface('test-1')
      expect(surface?.dataModel.get('name')).toBe('Buffered')
    })
  })

  // ===========================================================================
  // deleteSurface Tests
  // ===========================================================================

  describe('deleteSurface', () => {
    it('marks surface as deleted', () => {
      processor.processMessage({
        type: 'beginRendering',
        surfaceId: 'test-1',
        root: 'root',
      } as BeginRenderingMessage)

      processor.processMessage({
        type: 'deleteSurface',
        surfaceId: 'test-1',
      } as DeleteSurfaceMessage)

      const surface = processor.getSurface('test-1')
      expect(surface?.status).toBe('deleted')
    })

    it('removes surface from map after delay', async () => {
      processor.processMessage({
        type: 'beginRendering',
        surfaceId: 'test-1',
        root: 'root',
      } as BeginRenderingMessage)

      processor.processMessage({
        type: 'deleteSurface',
        surfaceId: 'test-1',
      } as DeleteSurfaceMessage)

      // Wait for cleanup timeout (100ms + buffer)
      await new Promise(resolve => setTimeout(resolve, 150))

      expect(processor.getSurface('test-1')).toBeUndefined()
      expect(processor.getSurfaceIds()).not.toContain('test-1')
    })

    it('does nothing for non-existent surface', () => {
      processor.processMessage({
        type: 'deleteSurface',
        surfaceId: 'non-existent',
      } as DeleteSurfaceMessage)

      expect(processor.getSurface('non-existent')).toBeUndefined()
    })
  })

  // ===========================================================================
  // Subscription Tests
  // ===========================================================================

  describe('subscriptions', () => {
    it('notifies subscribers on surface changes', () => {
      const callback = vi.fn()
      processor.subscribe(callback)

      processor.processMessage({
        type: 'beginRendering',
        surfaceId: 'test-1',
        root: 'root',
      } as BeginRenderingMessage)

      expect(callback).toHaveBeenCalledWith('test-1')
    })

    it('unsubscribe stops notifications', () => {
      const callback = vi.fn()
      const unsubscribe = processor.subscribe(callback)

      processor.processMessage({
        type: 'beginRendering',
        surfaceId: 'test-1',
        root: 'root',
      } as BeginRenderingMessage)

      expect(callback).toHaveBeenCalledTimes(1)

      unsubscribe()

      processor.processMessage({
        type: 'beginRendering',
        surfaceId: 'test-2',
        root: 'root',
      } as BeginRenderingMessage)

      expect(callback).toHaveBeenCalledTimes(1) // Still 1
    })

    it('version increments on changes', () => {
      const v1 = processor.getVersion()

      processor.processMessage({
        type: 'beginRendering',
        surfaceId: 'test-1',
        root: 'root',
      } as BeginRenderingMessage)

      expect(processor.getVersion()).toBeGreaterThan(v1)
    })
  })

  // ===========================================================================
  // Utility Tests
  // ===========================================================================

  describe('utilities', () => {
    it('getSurfaceIds returns all surface IDs', () => {
      processor.processMessage({
        type: 'beginRendering',
        surfaceId: 'surface-a',
        root: 'root',
      } as BeginRenderingMessage)

      processor.processMessage({
        type: 'beginRendering',
        surfaceId: 'surface-b',
        root: 'root',
      } as BeginRenderingMessage)

      const ids = processor.getSurfaceIds()
      expect(ids).toContain('surface-a')
      expect(ids).toContain('surface-b')
      expect(ids.length).toBe(2)
    })

    it('clear removes all surfaces', () => {
      processor.processMessage({
        type: 'beginRendering',
        surfaceId: 'test-1',
        root: 'root',
      } as BeginRenderingMessage)

      processor.clear()

      expect(processor.getSurfaceIds().length).toBe(0)
      expect(processor.getSurface('test-1')).toBeUndefined()
    })
  })
})
