import { ApiRouteConfig, Handlers, StepSchemaInput } from 'motia'
import { z } from 'zod'

/**
 * Demo Restaurant Agent
 * 
 * This step simulates an AI agent that generates restaurant recommendation UIs.
 * In production, this would call an LLM to generate the components.
 */

const bodySchema = z.object({
  query: z.string().min(1, 'Query is required'),
  sessionId: z.string().default('demo-session'),
})

const responseSchema = z.object({
  surfaceId: z.string(),
  message: z.string(),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'RestaurantAgent',
  description: 'Demo AI agent that generates restaurant recommendation UIs',
  path: '/demo/restaurant-agent',
  method: 'POST',
  emits: [],
  flows: ['demo-agent'],
  bodySchema: bodySchema as unknown as StepSchemaInput,
  responseSchema: {
    200: responseSchema as unknown as StepSchemaInput,
    500: z.object({ error: z.string() }) as unknown as StepSchemaInput,
  },
}

// Sample restaurant data
const RESTAURANTS = [
  {
    id: 'rest-1',
    name: 'The Italian Place',
    cuisine: 'Italian',
    rating: 4.5,
    priceLevel: '$$$',
    address: '123 Main Street, NYC',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
    description: 'Authentic Italian cuisine with homemade pasta and wood-fired pizzas.',
  },
  {
    id: 'rest-2',
    name: 'Sushi Corner',
    cuisine: 'Japanese',
    rating: 4.2,
    priceLevel: '$$',
    address: '456 Oak Avenue, NYC',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400',
    description: 'Fresh sushi and sashimi prepared by master chefs.',
  },
  {
    id: 'rest-3',
    name: 'Taco Fiesta',
    cuisine: 'Mexican',
    rating: 4.7,
    priceLevel: '$',
    address: '789 Elm Road, NYC',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400',
    description: 'Vibrant Mexican flavors with authentic street tacos.',
  },
]

export const handler: Handlers['RestaurantAgent'] = async (req, { logger, state, streams }) => {
  try {
    const { query, sessionId } = bodySchema.parse(req.body)
    const surfaceId = `restaurant-search-${Date.now()}`
    const groupId = `a2ui:session:${sessionId}`

    logger.info('Restaurant agent processing query', { query, surfaceId })

    // Create the surface
    const now = new Date().toISOString()
    const surface = {
      id: surfaceId,
      surfaceId,
      catalogId: 'https://a2ui.dev/specification/0.9/standard_catalog_definition.json',
      components: {} as Record<string, unknown>,
      dataModel: {
        query,
        restaurants: RESTAURANTS,
        selectedRestaurant: null,
      },
      createdAt: now,
      updatedAt: now,
    }

    // Generate UI components based on the query
    const components = generateRestaurantUI(query, RESTAURANTS)
    
    // Store components as a map
    for (const comp of components) {
      surface.components[comp.id] = comp
    }

    // Save to state and stream
    await state.set(groupId, surfaceId, surface)
    await streams.a2uiSurface.set(sessionId, surfaceId, surface)

    logger.info('Restaurant UI generated', { surfaceId, componentCount: components.length })

    return {
      status: 200,
      body: {
        surfaceId,
        message: `Found ${RESTAURANTS.length} restaurants for "${query}"`,
      },
    }
  } catch (error) {
    logger.error('Restaurant agent error', { error: (error as Error).message })
    return { status: 500, body: { error: (error as Error).message } }
  }
}

function generateRestaurantUI(query: string, restaurants: typeof RESTAURANTS) {
  const components: Array<Record<string, unknown>> = []

  // Header
  components.push({
    id: 'header-text',
    component: 'Text',
    text: `🍽️ Restaurants for "${query}"`,
    usageHint: 'h1',
  })

  components.push({
    id: 'subtitle',
    component: 'Text',
    text: `Found ${restaurants.length} great options near you`,
    usageHint: 'body',
  })

  // Restaurant cards
  const cardIds: string[] = []

  for (const restaurant of restaurants) {
    const cardId = `card-${restaurant.id}`
    cardIds.push(cardId)

    // Restaurant name
    components.push({
      id: `name-${restaurant.id}`,
      component: 'Text',
      text: restaurant.name,
      usageHint: 'h2',
    })

    // Restaurant image
    components.push({
      id: `img-${restaurant.id}`,
      component: 'Image',
      url: restaurant.image,
      usageHint: 'mediumFeature',
      fit: 'cover',
    })

    // Rating and price
    components.push({
      id: `meta-${restaurant.id}`,
      component: 'Text',
      text: `⭐ ${restaurant.rating} | ${restaurant.priceLevel} | ${restaurant.cuisine}`,
      usageHint: 'caption',
    })

    // Address
    components.push({
      id: `addr-${restaurant.id}`,
      component: 'Text',
      text: `📍 ${restaurant.address}`,
      usageHint: 'caption',
    })

    // Description
    components.push({
      id: `desc-${restaurant.id}`,
      component: 'Text',
      text: restaurant.description,
      usageHint: 'body',
    })

    // Book button
    components.push({
      id: `btn-book-${restaurant.id}`,
      component: 'Button',
      child: `btn-text-${restaurant.id}`,
      primary: true,
      action: {
        name: 'book_restaurant',
        context: {
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
        },
      },
    })

    components.push({
      id: `btn-text-${restaurant.id}`,
      component: 'Text',
      text: '📅 Book a Table',
      usageHint: 'body',
    })

    // Card column layout
    components.push({
      id: `col-${restaurant.id}`,
      component: 'Column',
      children: [
        `img-${restaurant.id}`,
        `name-${restaurant.id}`,
        `meta-${restaurant.id}`,
        `addr-${restaurant.id}`,
        `desc-${restaurant.id}`,
        `btn-book-${restaurant.id}`,
      ],
      alignment: 'start',
    })

    // Card wrapper
    components.push({
      id: cardId,
      component: 'Card',
      child: `col-${restaurant.id}`,
    })
  }

  // Main list of cards
  components.push({
    id: 'restaurant-list',
    component: 'List',
    children: cardIds,
    direction: 'vertical',
  })

  // Root column
  components.push({
    id: 'root',
    component: 'Column',
    children: ['header-text', 'subtitle', 'restaurant-list'],
    alignment: 'center',
  })

  return components
}

