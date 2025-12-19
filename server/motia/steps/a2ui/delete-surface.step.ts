import { ApiRouteConfig, Handlers, StepSchemaInput } from 'motia'
import { z } from 'zod'

const responseSchema = z.object({
  surfaceId: z.string(),
  deleted: z.boolean(),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'DeleteSurface',
  description: 'Deletes an A2UI surface',
  path: '/a2ui/surfaces/:surfaceId',
  method: 'DELETE',
  emits: [],
  virtualEmits: [{ topic: 'a2ui.surface.deleted', label: 'Surface deleted' }],
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

export const handler: Handlers['DeleteSurface'] = async (req, { logger, state, streams }) => {
  const surfaceId = req.pathParams.surfaceId
  const sessionId = (req.queryParams.sessionId as string) || 'default'
  const groupId = `a2ui:session:${sessionId}`

  logger.info('Deleting A2UI surface', { surfaceId })

  const surface = await state.get(groupId, surfaceId)
  if (!surface) {
    return { status: 404, body: { error: `Surface '${surfaceId}' not found` } }
  }

  await state.delete(groupId, surfaceId)
  await streams.a2uiSurface.delete(sessionId, surfaceId)

  logger.info('Surface deleted successfully', { surfaceId })

  return { status: 200, body: { surfaceId, deleted: true } }
}
