/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Widget } from '@/types/widget';

// 24. Step Counter
export const V09_STEP_COUNTER_WIDGET: Widget = {
  id: 'gallery-v09-step-counter',
  name: 'Step Counter',
  description: 'Daily step tracking with goal progress',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  specVersion: '0.9',
  root: 'root',
  components: [
    {
      id: 'root',
      component: 'Card',
      child: 'main-column',
    },
    {
      id: 'main-column',
      component: 'Column',
      children: ['header', 'steps-display', 'goal-text', 'divider', 'stats-row'],
      gap: 'medium',
      align: 'center',
    },
    {
      id: 'header',
      component: 'Row',
      children: ['steps-icon', 'title'],
      gap: 'small',
      align: 'center',
    },
    {
      id: 'steps-icon',
      component: 'Icon',
      name: 'directions_walk',
    },
    {
      id: 'title',
      component: 'Text',
      text: "Today's Steps",
      variant: 'h4',
    },
    {
      id: 'steps-display',
      component: 'Text',
      text: { path: '/steps' },
      variant: 'h1',
    },
    {
      id: 'goal-text',
      component: 'Text',
      text: { path: '/goalProgress' },
      variant: 'body',
    },
    {
      id: 'divider',
      component: 'Divider',
    },
    {
      id: 'stats-row',
      component: 'Row',
      children: ['distance-col', 'calories-col'],
      justify: 'spaceAround',
    },
    {
      id: 'distance-col',
      component: 'Column',
      children: ['distance-value', 'distance-label'],
      align: 'center',
    },
    {
      id: 'distance-value',
      component: 'Text',
      text: { path: '/distance' },
      variant: 'h3',
    },
    {
      id: 'distance-label',
      component: 'Text',
      text: 'Distance',
      variant: 'caption',
    },
    {
      id: 'calories-col',
      component: 'Column',
      children: ['calories-value', 'calories-label'],
      align: 'center',
    },
    {
      id: 'calories-value',
      component: 'Text',
      text: { path: '/calories' },
      variant: 'h3',
    },
    {
      id: 'calories-label',
      component: 'Text',
      text: 'Calories',
      variant: 'caption',
    },
  ],
  dataStates: [
    {
      name: 'Default',
      data: {
        steps: '8,432',
        goalProgress: '84% of 10,000 goal',
        distance: '3.8 mi',
        calories: '312',
      },
    },
  ],
};

export const V09_STEP_COUNTER_GALLERY = { widget: V09_STEP_COUNTER_WIDGET, height: 240 };
