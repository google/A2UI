import { z } from 'zod';

export const A2uiMessageSchema = z.object({
  createSurface: z.object({
    surfaceId: z.string(),
    catalogId: z.string(),
    theme: z.any().optional(),
  }).optional(),
  updateComponents: z.object({
    surfaceId: z.string(),
    components: z.array(z.record(z.any())),
  }).optional(),
  updateDataModel: z.object({
    surfaceId: z.string(),
    path: z.string().optional(),
    value: z.any(),
  }).optional(),
  deleteSurface: z.object({
    surfaceId: z.string(),
  }).optional(),
});

export type A2uiMessage = z.infer<typeof A2uiMessageSchema>;
