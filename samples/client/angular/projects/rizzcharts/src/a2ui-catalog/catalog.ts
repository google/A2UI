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
import { Canvas } from './canvas';
import { Chart } from './chart';
import { GoogleMap } from './google-map';
import { YouTube } from './youtube';

const customComponents: AngularComponentImplementation[] = [
  { name: 'Canvas', schema: z.object({}), component: Canvas },
  { name: 'Chart', schema: z.object({}), component: Chart },
  { name: 'GoogleMap', schema: z.object({}), component: GoogleMap },
  { name: 'YouTube', schema: z.object({}), component: YouTube },
];

/**
 * The Angular catalog for RizzCharts components.
 *
 * This catalog combines the standard A2UI components with custom components
 * specific to this project (Canvas, Chart, GoogleMap, YouTube). It is identified
 * by a unique URI that matches the catalog definition in the agent.
 */
export const RIZZ_CHARTS_CATALOG = new AngularCatalog(
  'https://github.com/google/A2UI/blob/main/samples/agent/adk/rizzcharts/rizzcharts_catalog_definition.json',
  [...BASIC_COMPONENTS, ...customComponents],
);
