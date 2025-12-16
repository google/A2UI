import { EventConfig, Handlers, StepSchemaInput } from 'motia'
import { z } from 'zod'
import { GoogleGenerativeAI } from '@google/generative-ai'

const inputSchema = z.object({
  sessionId: z.string(),
  surfaceId: z.string(),
  actionName: z.string(),
  context: z.record(z.string(), z.unknown()),
  requestType: z.string(),
})

type InputType = z.infer<typeof inputSchema>

export const config: EventConfig = {
  type: 'event',
  name: 'GenerateUI',
  description: 'Generates A2UI components using Gemini LLM based on user context',
  subscribes: ['a2ui.llm.request'],
  emits: ['a2ui.components.generated'],
  input: inputSchema as unknown as StepSchemaInput,
  flows: ['a2ui-protocol'],
}

const A2UI_SCHEMA_PROMPT = `
You are an A2UI component generator. Generate a JSON array of A2UI components based on the user's request.

Available components:
- Text: { id, component: "Text", text: string, usageHint?: "h1"|"h2"|"h3"|"body"|"caption" }
- Image: { id, component: "Image", url: string, fit?: "cover"|"contain" }
- Button: { id, component: "Button", child: string (id of Text), primary?: boolean, action: { name: string, context: {} } }
- Card: { id, component: "Card", child: string (id of inner component) }
- Column: { id, component: "Column", children: string[] (ids), alignment?: "start"|"center"|"end" }
- Row: { id, component: "Row", children: string[] (ids), distribution?: "start"|"center"|"end"|"spaceBetween" }
- List: { id, component: "List", children: string[] (ids), direction?: "vertical"|"horizontal" }
- TextField: { id, component: "TextField", label: string }
- CheckBox: { id, component: "CheckBox", label: string, value: boolean }
- Divider: { id, component: "Divider" }

Rules:
1. Always include a "root" component (usually Column) that contains all other components
2. Use unique IDs for each component
3. Reference child components by their ID
4. Return ONLY valid JSON array, no markdown or explanation
5. Make the UI visually appealing and user-friendly

Example output:
[
  { "id": "root", "component": "Column", "children": ["title", "card1"], "alignment": "center" },
  { "id": "title", "component": "Text", "text": "Welcome!", "usageHint": "h1" },
  { "id": "card1", "component": "Card", "child": "card1_content" },
  { "id": "card1_content", "component": "Text", "text": "Hello world", "usageHint": "body" }
]
`

export const handler: Handlers['GenerateUI'] = async (input, { emit, logger, state }) => {
  const { sessionId, surfaceId, actionName, context } = input as InputType

  logger.info('Generating UI with Gemini', { sessionId, surfaceId, actionName })

  let components: Array<Record<string, unknown>>

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const userPrompt = `
Action: ${actionName}
Context: ${JSON.stringify(context, null, 2)}

Generate an A2UI component tree for this action. The UI should:
- Be relevant to the action "${actionName}"
- Use the context data provided
- Include appropriate buttons for next steps
- Be visually organized with cards and proper spacing
`

    const result = await model.generateContent([
      { text: A2UI_SCHEMA_PROMPT },
      { text: userPrompt },
    ])

    const responseText = result.response.text()
    logger.info('Gemini response received', { responseLength: responseText.length })

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = responseText
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim()
    }

    components = JSON.parse(jsonText)
    logger.info('Parsed components', { count: components.length })

  } catch (error) {
    logger.error('Gemini generation failed, using fallback', { error: (error as Error).message })
    
    // Fallback components if LLM fails
    components = [
      { id: 'root', component: 'Column', children: ['header', 'content', 'actions'], alignment: 'center' },
      { id: 'header', component: 'Text', text: `Action: ${actionName}`, usageHint: 'h2' },
      { id: 'content', component: 'Card', child: 'content_text' },
      { id: 'content_text', component: 'Text', text: `We're processing your request. Context: ${JSON.stringify(context)}`, usageHint: 'body' },
      { id: 'actions', component: 'Row', children: ['ok_button'], distribution: 'end' },
      { id: 'ok_button_label', component: 'Text', text: 'OK' },
      { id: 'ok_button', component: 'Button', child: 'ok_button_label', primary: true, action: { name: 'dismiss', context: {} } },
    ]
  }

  await state.set(`a2ui:generated:${sessionId}`, surfaceId, {
    components,
    generatedAt: new Date().toISOString(),
    actionName,
  })

  await emit({
    topic: 'a2ui.components.generated',
    data: { sessionId, surfaceId, components, actionName },
  })

  logger.info('UI generated successfully', { surfaceId, componentCount: components.length })
}
