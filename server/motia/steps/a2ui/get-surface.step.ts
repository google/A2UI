import { ApiRouteConfig, Handlers, StepSchemaInput } from 'motia'
import { z } from 'zod'

const responseSchema = z.object({
  surfaceId: z.string(),
  catalogId: z.string(),
  components: z.record(z.string(), z.unknown()),
  dataModel: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'GetSurface',
  description: 'Gets an A2UI surface by ID',
  path: '/a2ui/surfaces/:surfaceId',
  method: 'GET',
  emits: [],
  virtualSubscribes: ['a2ui.surface.created'],
  flows: ['a2ui-protocol'],
  responseSchema: {
    200: responseSchema as unknown as StepSchemaInput,
    404: z.object({ error: z.string() }) as unknown as StepSchemaInput,
  },
  queryParams: [
    { name: 'sessionId', description: 'Session ID for the A2UI client' },
  ],
}

interface Surface {
  surfaceId: string
  catalogId: string
  components: Record<string, unknown>
  dataModel: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export const handler: Handlers['GetSurface'] = async (req, { logger, state }) => {
  const surfaceId = req.pathParams.surfaceId
  const sessionId = (req.queryParams.sessionId as string) || 'default'
  const groupId = `a2ui:session:${sessionId}`

  logger.info('Getting A2UI surface', { surfaceId })

  const surface = await state.get<Surface>(groupId, surfaceId)
  if (!surface) {
    return { status: 404, body: { error: `Surface '${surfaceId}' not found` } }
  }

  return {
    status: 200,
    body: {
      surfaceId: surface.surfaceId,
      catalogId: surface.catalogId,
      components: surface.components,
      dataModel: surface.dataModel,
      createdAt: surface.createdAt,
      updatedAt: surface.updatedAt,
    },
  }
}
