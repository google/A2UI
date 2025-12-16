import { StreamConfig } from 'motia'
import { z } from 'zod'

/**
 * A2UI Surface Stream
 * 
 * Real-time stream for A2UI surface state updates.
 * Clients subscribe to receive live updates when surfaces are created,
 * components are updated, or data models change.
 */

export const surfaceStreamSchema = z.object({
  id: z.string(),
  surfaceId: z.string(),
  catalogId: z.string(),
  components: z.record(z.string(), z.unknown()),
  dataModel: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type SurfaceStreamData = z.infer<typeof surfaceStreamSchema>

export const config: StreamConfig = {
  name: 'a2uiSurface',
  schema: surfaceStreamSchema,
  baseConfig: { storageType: 'default' },
}

