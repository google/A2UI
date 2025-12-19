/**
 * A2UI Schema Conformance Tests
 * Validates that our message handling conforms to the official A2UI JSON schemas
 */

import { describe, it, expect, beforeAll } from 'vitest'
import Ajv from 'ajv'
import serverToClientSchema from '../../src/schemas/server_to_client.json'

describe('A2UI Schema Conformance', () => {
  let ajv: Ajv
  let validateMessage: ReturnType<Ajv['compile']>

  beforeAll(() => {
    ajv = new Ajv({ strict: false, allErrors: true })
    validateMessage = ajv.compile(serverToClientSchema)
  })

  // ===========================================================================
  // beginRendering Message
  // ===========================================================================

  describe('beginRendering', () => {
    it('validates correct beginRendering message', () => {
      const message = {
        beginRendering: {
          surfaceId: 'surface-1',
          root: 'root',
        },
      }

      const valid = validateMessage(message)
      expect(valid).toBe(true)
    })

    it('validates beginRendering with optional catalogId', () => {
      const message = {
        beginRendering: {
          surfaceId: 'surface-1',
          root: 'root',
          catalogId: 'a2ui.org:standard_catalog_0_8_0',
        },
      }

      const valid = validateMessage(message)
      expect(valid).toBe(true)
    })

    it('validates beginRendering with styles', () => {
      const message = {
        beginRendering: {
          surfaceId: 'surface-1',
          root: 'root',
          styles: {
            theme: 'dark',
            primaryColor: '#1976d2',
          },
        },
      }

      const valid = validateMessage(message)
      expect(valid).toBe(true)
    })

    it('rejects beginRendering missing required fields', () => {
      const message = {
        beginRendering: {
          surfaceId: 'surface-1',
          // missing root
        },
      }

      const valid = validateMessage(message)
      expect(valid).toBe(false)
    })
  })

  // ===========================================================================
  // surfaceUpdate Message
  // ===========================================================================

  describe('surfaceUpdate', () => {
    it('validates correct surfaceUpdate message', () => {
      const message = {
        surfaceUpdate: {
          surfaceId: 'surface-1',
          components: [
            { id: 'root', component: { Text: { text: 'Hello' } } },
          ],
        },
      }

      const valid = validateMessage(message)
      expect(valid).toBe(true)
    })

    it('validates surfaceUpdate with multiple components', () => {
      const message = {
        surfaceUpdate: {
          surfaceId: 'surface-1',
          components: [
            { id: 'root', component: { Column: { children: ['title', 'content'] } } },
            { id: 'title', component: { Text: { text: 'Title', usageHint: 'h1' } } },
            { id: 'content', component: { Text: { text: 'Body text' } } },
          ],
        },
      }

      const valid = validateMessage(message)
      expect(valid).toBe(true)
    })

    it('validates component with weight property', () => {
      const message = {
        surfaceUpdate: {
          surfaceId: 'surface-1',
          components: [
            { id: 'item', weight: 2, component: { Text: { text: 'Weighted' } } },
          ],
        },
      }

      const valid = validateMessage(message)
      expect(valid).toBe(true)
    })

    it('rejects surfaceUpdate with empty components array', () => {
      const message = {
        surfaceUpdate: {
          surfaceId: 'surface-1',
          components: [],
        },
      }

      const valid = validateMessage(message)
      expect(valid).toBe(false)
    })

    it('rejects component missing required id', () => {
      const message = {
        surfaceUpdate: {
          surfaceId: 'surface-1',
          components: [
            { component: { Text: { text: 'Hello' } } }, // missing id
          ],
        },
      }

      const valid = validateMessage(message)
      expect(valid).toBe(false)
    })
  })

  // ===========================================================================
  // dataModelUpdate Message
  // ===========================================================================

  describe('dataModelUpdate', () => {
    it('validates correct dataModelUpdate with string value', () => {
      const message = {
        dataModelUpdate: {
          surfaceId: 'surface-1',
          contents: [
            { key: 'name', valueString: 'John' },
          ],
        },
      }

      const valid = validateMessage(message)
      expect(valid).toBe(true)
    })

    it('validates dataModelUpdate with number value', () => {
      const message = {
        dataModelUpdate: {
          surfaceId: 'surface-1',
          contents: [
            { key: 'count', valueNumber: 42 },
          ],
        },
      }

      const valid = validateMessage(message)
      expect(valid).toBe(true)
    })

    it('validates dataModelUpdate with boolean value', () => {
      const message = {
        dataModelUpdate: {
          surfaceId: 'surface-1',
          contents: [
            { key: 'enabled', valueBoolean: true },
          ],
        },
      }

      const valid = validateMessage(message)
      expect(valid).toBe(true)
    })

    it('validates dataModelUpdate with nested valueMap', () => {
      const message = {
        dataModelUpdate: {
          surfaceId: 'surface-1',
          contents: [
            {
              key: 'user',
              valueMap: [
                { key: 'name', valueString: 'John' },
                { key: 'age', valueNumber: 30 },
              ],
            },
          ],
        },
      }

      const valid = validateMessage(message)
      expect(valid).toBe(true)
    })

    it('validates dataModelUpdate with path', () => {
      const message = {
        dataModelUpdate: {
          surfaceId: 'surface-1',
          path: '/user/profile',
          contents: [
            { key: 'avatar', valueString: 'avatar.png' },
          ],
        },
      }

      const valid = validateMessage(message)
      expect(valid).toBe(true)
    })

    it('rejects dataModelUpdate missing contents', () => {
      const message = {
        dataModelUpdate: {
          surfaceId: 'surface-1',
        },
      }

      const valid = validateMessage(message)
      expect(valid).toBe(false)
    })
  })

  // ===========================================================================
  // deleteSurface Message
  // ===========================================================================

  describe('deleteSurface', () => {
    it('validates correct deleteSurface message', () => {
      const message = {
        deleteSurface: {
          surfaceId: 'surface-1',
        },
      }

      const valid = validateMessage(message)
      expect(valid).toBe(true)
    })

    it('rejects deleteSurface missing surfaceId', () => {
      const message = {
        deleteSurface: {},
      }

      const valid = validateMessage(message)
      expect(valid).toBe(false)
    })
  })

  // ===========================================================================
  // Additional Validation (Application Layer)
  // ===========================================================================

  describe('Additional Validation Notes', () => {
    it('schema allows multiple action types (application must validate)', () => {
      // Note: The JSON schema allows multiple action types in a single message
      // because each action type is an optional property. The A2UI spec says
      // "A message MUST contain exactly ONE of the action properties" but this
      // is enforced at the application level, not by the JSON schema itself.
      const message = {
        beginRendering: {
          surfaceId: 'surface-1',
          root: 'root',
        },
        deleteSurface: {
          surfaceId: 'surface-1',
        },
      }

      const valid = validateMessage(message)
      // Schema passes - application layer must enforce single action type
      expect(valid).toBe(true)
    })
  })
})
