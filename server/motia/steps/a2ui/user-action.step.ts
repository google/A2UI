import { ApiRouteConfig, Handlers, StepSchemaInput } from 'motia'
import { z } from 'zod'

const bodySchema = z.object({
  name: z.string(),
  surfaceId: z.string(),
  sourceComponentId: z.string(),
  timestamp: z.string(),
  context: z.record(z.string(), z.unknown()),
})

const responseSchema = z.object({
  received: z.boolean(),
  actionName: z.string(),
  timestamp: z.string(),
})

const errorSchema = z.object({ error: z.string() })

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'HandleUserAction',
  description: 'Handles user actions from A2UI components (button clicks, form submissions)',
  path: '/a2ui/actions',
  method: 'POST',
  emits: ['a2ui.action.received'],
  virtualEmits: [{ topic: 'a2ui.action.processing', label: 'Processing action' }],
  flows: ['a2ui-protocol'],
  bodySchema: bodySchema as unknown as StepSchemaInput,
  responseSchema: {
    200: responseSchema as unknown as StepSchemaInput,
    400: errorSchema as unknown as StepSchemaInput,
  },
  queryParams: [
    { name: 'sessionId', description: 'Session ID for the A2UI client' },
  ],
}

export const handler: Handlers['HandleUserAction'] = async (req, { emit, logger }) => {
  try {
    const action = bodySchema.parse(req.body)
    const sessionId = (req.queryParams.sessionId as string) || 'default'

    logger.info('Received A2UI user action', {
      actionName: action.name,
      surfaceId: action.surfaceId,
      sourceComponentId: action.sourceComponentId,
    })

    await emit({
      topic: 'a2ui.action.received',
      data: {
        sessionId,
        surfaceId: action.surfaceId,
        actionName: action.name,
        sourceComponentId: action.sourceComponentId,
        context: action.context,
        timestamp: action.timestamp,
      },
    })

    return {
      status: 200,
      body: {
        received: true,
        actionName: action.name,
        timestamp: action.timestamp,
      },
    }
  } catch (error) {
    logger.error('Failed to process action', { error: (error as Error).message })
    return { status: 400, body: { error: (error as Error).message } }
  }
}
