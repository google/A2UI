import { EventConfig, Handlers, StepSchemaInput } from 'motia'
import { z } from 'zod'

const inputSchema = z.object({
  sessionId: z.string(),
  surfaceId: z.string(),
  actionName: z.string(),
  sourceComponentId: z.string(),
  context: z.record(z.string(), z.unknown()),
  timestamp: z.string(),
})

type InputType = z.infer<typeof inputSchema>

export const config: EventConfig = {
  type: 'event',
  name: 'ProcessUserAction',
  description: 'Processes user actions from A2UI components and triggers responses',
  subscribes: ['a2ui.action.received'],
  emits: ['a2ui.llm.request'],
  virtualEmits: [{ topic: 'a2ui.response.ready', label: 'Response ready' }],
  input: inputSchema as unknown as StepSchemaInput,
  flows: ['a2ui-protocol'],
}

export const handler: Handlers['ProcessUserAction'] = async (input, { emit, logger, state }) => {
  const { sessionId, surfaceId, actionName, sourceComponentId, context } = input as InputType

  logger.info('Processing A2UI user action', { sessionId, surfaceId, actionName })

  await state.set(`a2ui:actions:${sessionId}`, actionName, {
    surfaceId,
    sourceComponentId,
    context,
    processedAt: new Date().toISOString(),
  })

  // Actions that should trigger LLM-based UI generation
  const llmActions = [
    'generate_',      // Any action starting with generate_
    'ai_',            // Any action starting with ai_
    'book_restaurant', // Restaurant booking flow
    'submit_query',   // Search/query submission
    'show_details',   // Show more details
    'customize_',     // Customization flows
  ]

  const needsLlm = llmActions.some(prefix => 
    actionName.startsWith(prefix) || actionName === prefix.replace('_', '')
  )

  if (needsLlm) {
    await emit({
      topic: 'a2ui.llm.request',
      data: { sessionId, surfaceId, actionName, context, requestType: 'action_response' },
    })
    logger.info('Action processed, LLM request emitted', { actionName, context })
  } else {
    logger.info('Action processed, no LLM required', { actionName })
  }
}
