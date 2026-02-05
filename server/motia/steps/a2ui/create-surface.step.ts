import { ApiRouteConfig, Handlers, StepSchemaInput } from 'motia'
import { z } from 'zod'

// =============================================================================
// Schemas
// =============================================================================

const STANDARD_CATALOG_ID = 'https://a2ui.dev/specification/0.9/standard_catalog_definition.json'

const bodySchema = z.object({
  surfaceId: z.string().min(1, 'Surface ID is required'),
  catalogId: z.string().default(STANDARD_CATALOG_ID),
})

const responseSchema = z.object({
  surfaceId: z.string(),
  catalogId: z.string(),
  createdAt: z.string(),
})

// =============================================================================
// Config
// =============================================================================

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'CreateSurface',
  description: 'Creates a new A2UI surface for rendering dynamic UI',
  path: '/a2ui/surfaces',
  method: 'POST',
  emits: [],
  virtualEmits: [
    { topic: 'a2ui.surface.created', label: 'Surface created' },
    { topic: 'a2ui.components.pending', label: 'Awaiting components' },
  ],
  flows: ['a2ui-protocol'],
  bodySchema: bodySchema as unknown as StepSchemaInput,
  responseSchema: {
    201: responseSchema as unknown as StepSchemaInput,
    400: z.object({ error: z.string() }) as unknown as StepSchemaInput,
    409: z.object({ error: z.string() }) as unknown as StepSchemaInput,
  },
  queryParams: [
    { name: 'sessionId', description: 'Session ID for the A2UI client' },
  ],
}

// =============================================================================
// Handler
// =============================================================================

export const handler: Handlers['CreateSurface'] = async (req, { logger, state, streams }) => {
  try {
    const { surfaceId, catalogId } = bodySchema.parse(req.body)
    const sessionId = (req.queryParams.sessionId as string) || 'default'
    const groupId = `a2ui:session:${sessionId}`

    logger.info('Creating A2UI surface', { surfaceId, catalogId, sessionId })

    // Check catalog support
    if (catalogId !== STANDARD_CATALOG_ID) {
      return { status: 400, body: { error: `Unsupported catalog: ${catalogId}` } }
    }

    // Check if surface already exists
    const existing = await state.get(groupId, surfaceId)
    if (existing) {
      return { status: 409, body: { error: `Surface '${surfaceId}' already exists` } }
    }

    // Create surface
    const now = new Date().toISOString()
    const surface = {
      id: surfaceId,
      surfaceId,
      catalogId,
      components: {},
      dataModel: {},
      createdAt: now,
      updatedAt: now,
    }

    await state.set(groupId, surfaceId, surface)

    // Update the stream for real-time subscribers
    await streams.a2uiSurface.set(sessionId, surfaceId, surface)

    logger.info('A2UI surface created successfully', { surfaceId })

    return {
      status: 201,
      body: {
        surfaceId: surface.surfaceId,
        catalogId: surface.catalogId,
        createdAt: surface.createdAt,
      },
    }
  } catch (error) {
    logger.error('Failed to create surface', { error: (error as Error).message })
    return { status: 400, body: { error: (error as Error).message } }
  }
}
