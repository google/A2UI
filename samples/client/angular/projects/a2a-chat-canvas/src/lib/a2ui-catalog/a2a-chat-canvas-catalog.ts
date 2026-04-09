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

import { BASIC_COMPONENTS, AngularCatalog, AngularComponentImplementation } from '@a2ui/angular';
import { z } from 'zod';
import { Canvas } from './canvas/canvas';

const customComponents: AngularComponentImplementation[] = [
  { name: 'Canvas', schema: z.object({}), component: Canvas },
];

/**
 * The Angular catalog for a2a-chat-canvas components.
 */
export const A2A_CHAT_CANVAS_CATALOG = new AngularCatalog(
  'https://github.com/google/A2UI/blob/main/samples/client/angular/projects/a2a-chat-canvas/src/lib/a2ui-catalog/catalog_definition.json',
  [...BASIC_COMPONENTS, ...customComponents],
);
