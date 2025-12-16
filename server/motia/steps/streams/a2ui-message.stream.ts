import { StreamConfig } from 'motia'
import { z } from 'zod'

/**
 * A2UI Message Stream
 * 
 * Real-time stream for A2UI protocol messages.
 * Used to stream individual A2UI messages (createSurface, updateComponents, etc.)
 * to connected clients.
 */

export const messageStreamSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  messageType: z.enum(['createSurface', 'updateComponents', 'updateDataModel', 'deleteSurface']),
  payload: z.unknown(),
  timestamp: z.string(),
})

export type MessageStreamData = z.infer<typeof messageStreamSchema>

export const config: StreamConfig = {
  name: 'a2uiMessage',
  schema: messageStreamSchema,
  baseConfig: { storageType: 'default' },
}

