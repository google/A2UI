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

export const V09_TASK_CARD_WIDGET: Widget = {
  id: 'gallery-v09-task-card',
  name: 'Task Card',
  description: 'Task item with priority and due date',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  specVersion: '0.9',
  root: 'root',
  components: [
    {
      id: 'root',
      component: 'Card',
      child: 'main-row',
    },
    {
      id: 'main-row',
      component: 'Row',
      children: ['content', 'priority'],
      gap: 'medium',
      align: 'start',
    },
    {
      id: 'content',
      component: 'Column',
      children: ['title', 'description', 'meta-row'],
      gap: 'small',
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
      id: 'meta-row',
      component: 'Row',
      children: ['due-date', 'project'],
      gap: 'medium',
    },
    {
      id: 'due-date',
      component: 'Text',
      text: { path: '/dueDate' },
      variant: 'caption',
    },
    {
      id: 'project',
      component: 'Text',
      text: { path: '/project' },
      variant: 'caption',
    },
    {
      id: 'priority',
      component: 'Icon',
      name: { path: '/priorityIcon' },
    },
  ],
  dataStates: [
    {
      name: 'High Priority',
      data: {
        title: 'Review pull request',
        description: 'Review and approve the authentication module changes.',
        dueDate: 'Today',
        project: 'Backend',
        priorityIcon: 'priority_high',
      },
    },
  ],
};

export const V09_TASK_CARD_GALLERY = {
  widget: V09_TASK_CARD_WIDGET,
  height: 120,
};
