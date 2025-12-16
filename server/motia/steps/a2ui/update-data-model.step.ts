import { ApiRouteConfig, Handlers, StepSchemaInput } from 'motia'
import { z } from 'zod'

const bodySchema = z.object({
  path: z.string().optional().default('/'),
  op: z.enum(['add', 'replace', 'remove']).optional().default('replace'),
  value: z.unknown().optional(),
})

const responseSchema = z.object({
  surfaceId: z.string(),
  path: z.string(),
  op: z.string(),
  updatedAt: z.string(),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'UpdateDataModel',
  description: 'Updates the data model for an A2UI surface',
  path: '/a2ui/surfaces/:surfaceId/data',
  method: 'PATCH',
  emits: [],
  virtualEmits: [{ topic: 'a2ui.datamodel.updated', label: 'Data model updated' }],
  virtualSubscribes: ['a2ui.surface.created'],
  flows: ['a2ui-protocol'],
  bodySchema: bodySchema as unknown as StepSchemaInput,
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
  dataModel: Record<string, unknown>
  updatedAt: string
}

export const handler: Handlers['UpdateDataModel'] = async (req, { logger, state, streams }) => {
  try {
    const surfaceId = req.pathParams.surfaceId
    const { path, op, value } = bodySchema.parse(req.body)
    const sessionId = (req.queryParams.sessionId as string) || 'default'
    const groupId = `a2ui:session:${sessionId}`

    logger.info('Updating A2UI data model', { surfaceId, path, op })

    const surface = await state.get<Surface>(groupId, surfaceId)
    if (!surface) {
      return { status: 404, body: { error: `Surface '${surfaceId}' not found` } }
    }

    // Apply path operation
    if (!path || path === '/') {
      surface.dataModel = op === 'remove' ? {} : (value as Record<string, unknown>)
    } else {
      const parts = path.split('/').filter(Boolean)
      let current: Record<string, unknown> = surface.dataModel
      
      for (let i = 0; i < parts.length - 1; i++) {
        if (!(parts[i] in current)) current[parts[i]] = {}
        current = current[parts[i]] as Record<string, unknown>
      }

      const lastKey = parts[parts.length - 1]
      if (op === 'remove') delete current[lastKey]
      else current[lastKey] = value
    }

    surface.updatedAt = new Date().toISOString()
    await state.set(groupId, surfaceId, surface)
    await streams.a2uiSurface.set(sessionId, surfaceId, surface)

    logger.info('Data model updated successfully', { surfaceId })

    return {
      status: 200,
      body: { surfaceId, path, op, updatedAt: surface.updatedAt },
    }
  } catch (error) {
    logger.error('Failed to update data model', { error: (error as Error).message })
    return { status: 400, body: { error: (error as Error).message } }
  }
}
