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

// 16. Workout Summary
export const V09_WORKOUT_SUMMARY_WIDGET: Widget = {
  id: 'gallery-v09-workout-summary',
  name: 'Workout Summary',
  description: 'Exercise session summary with metrics',
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
      children: ['header', 'divider', 'metrics-row', 'date'],
      gap: 'medium',
    },
    {
      id: 'header',
      component: 'Row',
      children: ['workout-icon', 'title'],
      gap: 'small',
      align: 'center',
    },
    {
      id: 'workout-icon',
      component: 'Icon',
      name: { path: '/icon' },
    },
    {
      id: 'title',
      component: 'Text',
      text: 'Workout Complete',
      variant: 'h3',
    },
    {
      id: 'divider',
      component: 'Divider',
    },
    {
      id: 'metrics-row',
      component: 'Row',
      children: ['duration-col', 'calories-col', 'distance-col'],
      justify: 'spaceAround',
    },
    {
      id: 'duration-col',
      component: 'Column',
      children: ['duration-value', 'duration-label'],
      align: 'center',
    },
    {
      id: 'duration-value',
      component: 'Text',
      text: { path: '/duration' },
      variant: 'h3',
    },
    {
      id: 'duration-label',
      component: 'Text',
      text: 'Duration',
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
      id: 'date',
      component: 'Text',
      text: { path: '/date' },
      variant: 'caption',
    },
  ],
  dataStates: [
    {
      name: 'Default',
      data: {
        icon: 'directions_run',
        workoutType: 'Morning Run',
        duration: '32:15',
        calories: '385',
        distance: '5.2 km',
        date: 'Today at 7:30 AM',
      },
    },
  ],
};

export const V09_WORKOUT_SUMMARY_GALLERY = { widget: V09_WORKOUT_SUMMARY_WIDGET, height: 280 };
