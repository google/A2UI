import { EventConfig, Handlers } from 'motia'
import { z } from 'zod'

const inputSchema = z.object({
  sessionId: z.string(),
  surfaceId: z.string(),
  components: z.array(z.record(z.string(), z.unknown())),
  actionName: z.string(),
})

export const config: EventConfig = {
  type: 'event',
  name: 'ApplyGeneratedUI',
  description: 'Applies LLM-generated components to an A2UI surface',
  subscribes: ['a2ui.components.generated'],
  emits: [],
  virtualEmits: [{ topic: 'a2ui.components.updated', label: 'Components updated' }],
  input: inputSchema,
  flows: ['a2ui-protocol'],
}

interface Surface {
  surfaceId: string
  components: Record<string, unknown>
  updatedAt: string
}

export const handler: Handlers['ApplyGeneratedUI'] = async (input, { logger, state, streams }) => {
  const { sessionId, surfaceId, components, actionName } = input
  const groupId = `a2ui:session:${sessionId}`

  logger.info('Applying generated UI', { sessionId, surfaceId, componentCount: components.length })

  const surface = await state.get<Surface>(groupId, surfaceId)
  if (!surface) {
    logger.error('Surface not found', { surfaceId })
    return
  }

  for (const component of components) {
    surface.components[component.id as string] = component
  }
  surface.updatedAt = new Date().toISOString()

  await state.set(groupId, surfaceId, surface)
  await streams.a2uiSurface.set(sessionId, surfaceId, surface)

  logger.info('Generated UI applied', { surfaceId, componentCount: components.length })
}
