import { ApiRouteConfig, Handlers, StepSchemaInput } from 'motia'
import { z } from 'zod'

// =============================================================================
// Schemas
// =============================================================================

const stringOrPath = z.union([z.string(), z.object({ path: z.string() })])
const numberOrPath = z.union([z.number(), z.object({ path: z.string() })])
const boolOrPath = z.union([z.boolean(), z.object({ path: z.string() })])
const childrenProp = z.union([z.array(z.string()), z.object({ componentId: z.string(), path: z.string() })])

const componentBase = { id: z.string(), weight: z.number().optional() }

const anyComponent = z.discriminatedUnion('component', [
  z.object({ ...componentBase, component: z.literal('Text'), text: stringOrPath, usageHint: z.string().optional() }),
  z.object({ ...componentBase, component: z.literal('Image'), url: stringOrPath }),
  z.object({ ...componentBase, component: z.literal('Icon'), name: z.union([z.string(), z.object({ path: z.string() })]) }),
  z.object({ ...componentBase, component: z.literal('Video'), url: stringOrPath }),
  z.object({ ...componentBase, component: z.literal('AudioPlayer'), url: stringOrPath }),
  z.object({ ...componentBase, component: z.literal('Row'), children: childrenProp }),
  z.object({ ...componentBase, component: z.literal('Column'), children: childrenProp }),
  z.object({ ...componentBase, component: z.literal('List'), children: childrenProp }),
  z.object({ ...componentBase, component: z.literal('Card'), child: z.string() }),
  z.object({ ...componentBase, component: z.literal('Tabs'), tabItems: z.array(z.object({ title: stringOrPath, child: z.string() })) }),
  z.object({ ...componentBase, component: z.literal('Divider') }),
  z.object({ ...componentBase, component: z.literal('Modal'), entryPointChild: z.string(), contentChild: z.string() }),
  z.object({ ...componentBase, component: z.literal('Button'), child: z.string(), action: z.object({ name: z.string(), context: z.record(z.string(), z.unknown()).optional() }) }),
  z.object({ ...componentBase, component: z.literal('CheckBox'), label: stringOrPath, value: boolOrPath }),
  z.object({ ...componentBase, component: z.literal('TextField'), label: stringOrPath }),
  z.object({ ...componentBase, component: z.literal('DateTimeInput'), value: stringOrPath }),
  z.object({ ...componentBase, component: z.literal('ChoicePicker'), options: z.array(z.object({ label: stringOrPath, value: z.string() })), value: z.union([z.array(z.string()), z.object({ path: z.string() })]), usageHint: z.string() }),
  z.object({ ...componentBase, component: z.literal('Slider'), value: numberOrPath }),
])

const bodySchema = z.object({
  components: z.array(anyComponent).min(1),
})

const responseSchema = z.object({
  surfaceId: z.string(),
  componentCount: z.number(),
  updatedAt: z.string(),
})

// =============================================================================
// Config
// =============================================================================

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'UpdateComponents',
  description: 'Updates components in an existing A2UI surface',
  path: '/a2ui/surfaces/:surfaceId/components',
  method: 'PUT',
  emits: [],
  virtualEmits: [{ topic: 'a2ui.components.updated', label: 'Components updated' }],
  virtualSubscribes: ['a2ui.surface.created'],
  flows: ['a2ui-protocol'],
  bodySchema: bodySchema as unknown as StepSchemaInput,
  responseSchema: {
    200: responseSchema as unknown as StepSchemaInput,
    400: z.object({ error: z.string() }) as unknown as StepSchemaInput,
    404: z.object({ error: z.string() }) as unknown as StepSchemaInput,
  },
  queryParams: [
    { name: 'sessionId', description: 'Session ID for the A2UI client' },
  ],
}

// =============================================================================
// Handler
// =============================================================================

interface Surface {
  surfaceId: string
  components: Record<string, unknown>
  updatedAt: string
}

export const handler: Handlers['UpdateComponents'] = async (req, { logger, state, streams }) => {
  try {
    const surfaceId = req.pathParams.surfaceId
    const { components } = bodySchema.parse(req.body)
    const sessionId = (req.queryParams.sessionId as string) || 'default'
    const groupId = `a2ui:session:${sessionId}`

    logger.info('Updating A2UI components', { surfaceId, componentCount: components.length })

    const surface = await state.get<Surface>(groupId, surfaceId)
    if (!surface) {
      return { status: 404, body: { error: `Surface '${surfaceId}' not found` } }
    }

    // Update components
    for (const component of components) {
      surface.components[component.id] = component
    }
    surface.updatedAt = new Date().toISOString()

    await state.set(groupId, surfaceId, surface)
    await streams.a2uiSurface.set(sessionId, surfaceId, surface)

    logger.info('Components updated successfully', { surfaceId })

    return {
      status: 200,
      body: {
        surfaceId,
        componentCount: Object.keys(surface.components).length,
        updatedAt: surface.updatedAt,
      },
    }
  } catch (error) {
    logger.error('Failed to update components', { error: (error as Error).message })
    return { status: 400, body: { error: (error as Error).message } }
  }
}
