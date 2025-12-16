import { ApiRouteConfig, Handlers, StepSchemaInput } from 'motia'
import { z } from 'zod'

const responseSchema = z.object({
  surfaces: z.array(z.object({
    surfaceId: z.string(),
    catalogId: z.string(),
    componentCount: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })),
  count: z.number(),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'ListSurfaces',
  description: 'Lists all A2UI surfaces for a session',
  path: '/a2ui/surfaces',
  method: 'GET',
  emits: [],
  flows: ['a2ui-protocol'],
  responseSchema: {
    200: responseSchema as unknown as StepSchemaInput,
  },
  queryParams: [
    { name: 'sessionId', description: 'Session ID for the A2UI client' },
  ],
}

interface Surface {
  surfaceId: string
  catalogId: string
  components: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export const handler: Handlers['ListSurfaces'] = async (req, { logger, state }) => {
  const sessionId = (req.queryParams.sessionId as string) || 'default'
  const groupId = `a2ui:session:${sessionId}`

  logger.info('Listing A2UI surfaces', { sessionId })

  const surfaces = await state.getGroup<Surface>(groupId)

  return {
    status: 200,
    body: {
      surfaces: surfaces.map((s) => ({
        surfaceId: s.surfaceId,
        catalogId: s.catalogId,
        componentCount: Object.keys(s.components).length,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      count: surfaces.length,
    },
  }
}
