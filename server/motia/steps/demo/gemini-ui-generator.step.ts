import { ApiRouteConfig, Handlers, StepSchemaInput } from 'motia'
import { z } from 'zod'
import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * Gemini UI Generator
 * 
 * Uses Gemini API to generate complex A2UI components from natural language prompts.
 * This demonstrates LLM-powered UI generation through the Motia A2UI server.
 */

const bodySchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  sessionId: z.string().default('gemini-session'),
  surfaceId: z.string().optional(),
})

const responseSchema = z.object({
  surfaceId: z.string(),
  componentCount: z.number(),
  prompt: z.string(),
  generatedAt: z.string(),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'GeminiUIGenerator',
  description: 'Generates complex A2UI interfaces using Gemini AI',
  path: '/demo/generate-ui',
  method: 'POST',
  emits: [],
  flows: ['demo-agent'],
  bodySchema: bodySchema as unknown as StepSchemaInput,
  responseSchema: {
    200: responseSchema as unknown as StepSchemaInput,
    400: z.object({ error: z.string() }) as unknown as StepSchemaInput,
    500: z.object({ error: z.string(), details: z.string().optional() }) as unknown as StepSchemaInput,
  },
}

const A2UI_SYSTEM_PROMPT = `You are an A2UI (Agent-to-User Interface) component generator. Your task is to generate a JSON array of UI components based on user requests.

## Available Components

### Display Components
- **Text**: { id, component: "Text", text: string, usageHint?: "h1"|"h2"|"h3"|"body"|"caption" }
- **Image**: { id, component: "Image", url: string }
- **Icon**: { id, component: "Icon", name: string } // Use Material Icon names
- **Divider**: { id, component: "Divider" }

### Layout Components  
- **Column**: { id, component: "Column", children: string[] (array of component IDs) }
- **Row**: { id, component: "Row", children: string[] }
- **Card**: { id, component: "Card", child: string (single component ID) }
- **List**: { id, component: "List", children: string[] }

### Interactive Components
- **Button**: { id, component: "Button", child: string (ID of Text component for label), action: { name: string, context?: {} } }
- **TextField**: { id, component: "TextField", label: string }
- **CheckBox**: { id, component: "CheckBox", label: string, value: boolean }
- **Slider**: { id, component: "Slider", value: number }

## Rules
1. Always start with a "root" Column component containing all top-level elements
2. Use unique, descriptive IDs (e.g., "header-title", "user-card", "submit-btn")
3. Buttons MUST have a child Text component for their label
4. Cards contain a single child (usually a Column with multiple children)
5. Create visually appealing, well-structured UIs
6. Use appropriate usageHint for Text (h1 for titles, h2 for section headers, body for content, caption for metadata)
7. Group related content in Cards
8. Use real, working image URLs from Unsplash when images are needed

## Response Format
Return ONLY a valid JSON array. No markdown, no explanations, no code blocks.

## Example
For "Create a user profile card":
[
  {"id":"root","component":"Column","children":["profile-card"]},
  {"id":"profile-card","component":"Card","child":"profile-content"},
  {"id":"profile-content","component":"Column","children":["avatar","name","email","edit-btn"]},
  {"id":"avatar","component":"Image","url":"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100"},
  {"id":"name","component":"Text","text":"John Doe","usageHint":"h2"},
  {"id":"email","component":"Text","text":"john@example.com","usageHint":"caption"},
  {"id":"edit-btn-label","component":"Text","text":"Edit Profile"},
  {"id":"edit-btn","component":"Button","child":"edit-btn-label","action":{"name":"edit_profile"}}
]`

export const handler: Handlers['GeminiUIGenerator'] = async (req, { logger, state, streams }) => {
  const apiKey = process.env.GEMINI_API_KEY
  
  if (!apiKey) {
    logger.error('GEMINI_API_KEY not set')
    return {
      status: 500,
      body: { 
        error: 'Gemini API key not configured',
        details: 'Set GEMINI_API_KEY environment variable'
      }
    }
  }

  try {
    const { prompt, sessionId, surfaceId: providedSurfaceId } = bodySchema.parse(req.body)
    const surfaceId = providedSurfaceId || `gemini-ui-${Date.now()}`
    const groupId = `a2ui:session:${sessionId}`

    logger.info('Generating UI with Gemini', { prompt, surfaceId })

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      }
    })

    // Generate UI components
    const result = await model.generateContent([
      { text: A2UI_SYSTEM_PROMPT },
      { text: `Generate an A2UI component tree for: "${prompt}"` },
    ])

    const responseText = result.response.text()
    logger.info('Gemini response received', { length: responseText.length })

    // Parse JSON from response (handle potential markdown)
    let jsonText = responseText.trim()
    
    // Remove markdown code blocks if present
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim()
    }
    
    // Remove any leading/trailing text
    const arrayStart = jsonText.indexOf('[')
    const arrayEnd = jsonText.lastIndexOf(']')
    if (arrayStart !== -1 && arrayEnd !== -1) {
      jsonText = jsonText.slice(arrayStart, arrayEnd + 1)
    }

    const components = JSON.parse(jsonText) as Array<Record<string, unknown>>
    
    if (!Array.isArray(components) || components.length === 0) {
      throw new Error('Invalid response: expected non-empty array')
    }

    logger.info('Parsed components', { count: components.length })

    // Create surface with generated components
    const now = new Date().toISOString()
    const surface = {
      id: surfaceId,
      surfaceId,
      catalogId: 'https://a2ui.dev/specification/0.9/standard_catalog_definition.json',
      components: {} as Record<string, unknown>,
      dataModel: {
        generatedFrom: prompt,
        generatedAt: now,
      },
      createdAt: now,
      updatedAt: now,
    }

    // Store components as map
    for (const comp of components) {
      if (comp.id && typeof comp.id === 'string') {
        surface.components[comp.id] = comp
      }
    }

    // Save to state and stream
    await state.set(groupId, surfaceId, surface)
    await streams.a2uiSurface.set(sessionId, surfaceId, surface)

    logger.info('UI generated successfully', { 
      surfaceId, 
      componentCount: Object.keys(surface.components).length 
    })

    return {
      status: 200,
      body: {
        surfaceId,
        componentCount: Object.keys(surface.components).length,
        prompt,
        generatedAt: now,
      },
    }
  } catch (error) {
    const errorMessage = (error as Error).message
    logger.error('Gemini generation failed', { error: errorMessage })
    
    return {
      status: 500,
      body: {
        error: 'Failed to generate UI',
        details: errorMessage,
      },
    }
  }
}

