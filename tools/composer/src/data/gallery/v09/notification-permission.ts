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

export const V09_NOTIFICATION_PERMISSION_WIDGET: Widget = {
  id: 'gallery-v09-notification-permission',
  name: 'Notification',
  description: 'Permission request dialog for notifications',
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
      children: ['icon', 'title', 'description', 'actions'],
      gap: 'medium',
      align: 'center',
    },
    {
      id: 'icon',
      component: 'Icon',
      name: { path: '/icon' },
    },
    {
      id: 'title',
      component: 'Text',
      text: { path: '/title' },
      variant: 'h3',
    },
    {
      id: 'description',
      component: 'Text',
      text: { path: '/description' },
      variant: 'body',
    },
    {
      id: 'actions',
      component: 'Row',
      children: ['yes-btn', 'no-btn'],
      gap: 'medium',
      justify: 'center',
    },
    {
      id: 'yes-btn-text',
      component: 'Text',
      text: 'Yes',
    },
    {
      id: 'yes-btn',
      component: 'Button',
      child: 'yes-btn-text',
      action: { event: { name: 'accept' } },
    },
    {
      id: 'no-btn-text',
      component: 'Text',
      text: 'No',
    },
    {
      id: 'no-btn',
      component: 'Button',
      child: 'no-btn-text',
      action: { event: { name: 'decline' } },
    },
  ],
  dataStates: [
    {
      name: 'Default',
      data: {
        icon: 'check',
        title: 'Enable notification',
        description: 'Get alerts for order status changes',
      },
    },
  ],
};

export const V09_NOTIFICATION_PERMISSION_GALLERY = {
  widget: V09_NOTIFICATION_PERMISSION_WIDGET,
  height: 180,
};
