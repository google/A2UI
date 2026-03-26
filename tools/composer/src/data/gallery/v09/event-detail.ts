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

// 17. Event Detail Card
export const V09_EVENT_DETAIL_WIDGET: Widget = {
  id: 'gallery-v09-event-detail',
  name: 'Event Detail Card',
  description: 'Detailed event view with time, location, and RSVP',
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
      children: ['title', 'time-row', 'location-row', 'description', 'divider', 'actions'],
      gap: 'medium',
    },
    {
      id: 'title',
      component: 'Text',
      text: { path: '/title' },
      variant: 'h2',
    },
    {
      id: 'time-row',
      component: 'Row',
      children: ['time-icon', 'time-text'],
      gap: 'small',
      align: 'center',
    },
    {
      id: 'time-icon',
      component: 'Icon',
      name: 'schedule',
    },
    {
      id: 'time-text',
      component: 'Text',
      text: { path: '/dateTime' },
      variant: 'body',
    },
    {
      id: 'location-row',
      component: 'Row',
      children: ['location-icon', 'location-text'],
      gap: 'small',
      align: 'center',
    },
    {
      id: 'location-icon',
      component: 'Icon',
      name: 'location_on',
    },
    {
      id: 'location-text',
      component: 'Text',
      text: { path: '/location' },
      variant: 'body',
    },
    {
      id: 'description',
      component: 'Text',
      text: { path: '/description' },
      variant: 'body',
    },
    {
      id: 'divider',
      component: 'Divider',
    },
    {
      id: 'actions',
      component: 'Row',
      children: ['accept-btn', 'decline-btn'],
      gap: 'small',
    },
    {
      id: 'accept-btn-text',
      component: 'Text',
      text: 'Accept',
    },
    {
      id: 'accept-btn',
      component: 'Button',
      child: 'accept-btn-text',
      action: { event: { name: 'accept' } },
    },
    {
      id: 'decline-btn-text',
      component: 'Text',
      text: 'Decline',
    },
    {
      id: 'decline-btn',
      component: 'Button',
      child: 'decline-btn-text',
      action: { event: { name: 'decline' } },
    },
  ],
  dataStates: [
    {
      name: 'Default',
      data: {
        title: 'Product Launch Meeting',
        dateTime: 'Thu, Dec 19 • 2:00 PM - 3:30 PM',
        location: 'Conference Room A, Building 2',
        description: 'Review final product specs and marketing materials before the Q1 launch.',
      },
    },
  ],
};

export const V09_EVENT_DETAIL_GALLERY = { widget: V09_EVENT_DETAIL_WIDGET, height: 300 };
