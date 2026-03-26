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

// 29. Countdown Timer
export const V09_COUNTDOWN_TIMER_WIDGET: Widget = {
  id: 'gallery-v09-countdown-timer',
  name: 'Countdown Timer',
  description: 'Event countdown with days, hours, minutes',
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
      children: ['event-name', 'countdown-row', 'target-date'],
      gap: 'medium',
      align: 'center',
    },
    {
      id: 'event-name',
      component: 'Text',
      text: { path: '/eventName' },
      variant: 'h3',
    },
    {
      id: 'countdown-row',
      component: 'Row',
      children: ['days-col', 'hours-col', 'minutes-col'],
      justify: 'spaceAround',
    },
    {
      id: 'days-col',
      component: 'Column',
      children: ['days-value', 'days-label'],
      align: 'center',
    },
    {
      id: 'days-value',
      component: 'Text',
      text: { path: '/days' },
      variant: 'h1',
    },
    {
      id: 'days-label',
      component: 'Text',
      text: 'Days',
      variant: 'caption',
    },
    {
      id: 'hours-col',
      component: 'Column',
      children: ['hours-value', 'hours-label'],
      align: 'center',
    },
    {
      id: 'hours-value',
      component: 'Text',
      text: { path: '/hours' },
      variant: 'h1',
    },
    {
      id: 'hours-label',
      component: 'Text',
      text: 'Hours',
      variant: 'caption',
    },
    {
      id: 'minutes-col',
      component: 'Column',
      children: ['minutes-value', 'minutes-label'],
      align: 'center',
    },
    {
      id: 'minutes-value',
      component: 'Text',
      text: { path: '/minutes' },
      variant: 'h1',
    },
    {
      id: 'minutes-label',
      component: 'Text',
      text: 'Minutes',
      variant: 'caption',
    },
    {
      id: 'target-date',
      component: 'Text',
      text: { path: '/targetDate' },
      variant: 'body',
    },
  ],
  dataStates: [
    {
      name: 'Default',
      data: {
        eventName: 'Product Launch',
        days: '14',
        hours: '08',
        minutes: '32',
        targetDate: 'January 15, 2025',
      },
    },
  ],
};

export const V09_COUNTDOWN_TIMER_GALLERY = { widget: V09_COUNTDOWN_TIMER_WIDGET, height: 220 };
