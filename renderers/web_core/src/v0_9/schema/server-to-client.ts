/*
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { z } from "zod";

export const A2uiMessageSchema = z.object({
  createSurface: z
    .object({
      surfaceId: z.string(),
      catalogId: z.string(),
      theme: z.any().optional(),
    })
    .optional(),
  updateComponents: z
    .object({
      surfaceId: z.string(),
      components: z.array(z.record(z.any())),
    })
    .optional(),
  updateDataModel: z
    .object({
      surfaceId: z.string(),
      path: z.string().optional(),
      value: z.any(),
    })
    .optional(),
  deleteSurface: z
    .object({
      surfaceId: z.string(),
    })
    .optional(),
});

/** A message sent from the A2UI server to the client. */
export type A2uiMessage = z.infer<typeof A2uiMessageSchema>;
