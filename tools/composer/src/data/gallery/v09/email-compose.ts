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

export const V09_EMAIL_COMPOSE_WIDGET: Widget = {
  id: 'gallery-v09-email-compose',
  name: 'Email Compose',
  description: 'Email composition form with recipient and message fields',
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
      children: ['from-row', 'to-row', 'subject-row', 'divider', 'message', 'actions'],
      gap: 'small',
    },
    {
      id: 'from-row',
      component: 'Row',
      children: ['from-label', 'from-value'],
      gap: 'medium',
      align: 'center',
    },
    {
      id: 'from-label',
      component: 'Text',
      text: 'FROM',
      variant: 'caption',
    },
    {
      id: 'from-value',
      component: 'Text',
      text: { path: '/from' },
      variant: 'body',
    },
    {
      id: 'to-row',
      component: 'Row',
      children: ['to-label', 'to-value'],
      gap: 'medium',
      align: 'center',
    },
    {
      id: 'to-label',
      component: 'Text',
      text: 'TO',
      variant: 'caption',
    },
    {
      id: 'to-value',
      component: 'Text',
      text: { path: '/to' },
      variant: 'body',
    },
    {
      id: 'subject-row',
      component: 'Row',
      children: ['subject-label', 'subject-value'],
      gap: 'medium',
      align: 'center',
    },
    {
      id: 'subject-label',
      component: 'Text',
      text: 'SUBJECT',
      variant: 'caption',
    },
    {
      id: 'subject-value',
      component: 'Text',
      text: { path: '/subject' },
      variant: 'body',
    },
    {
      id: 'divider',
      component: 'Divider',
    },
    {
      id: 'message',
      component: 'Column',
      children: ['greeting', 'body-text', 'closing', 'signature'],
      gap: 'small',
    },
    {
      id: 'greeting',
      component: 'Text',
      text: { path: '/greeting' },
      variant: 'body',
    },
    {
      id: 'body-text',
      component: 'Text',
      text: { path: '/body' },
      variant: 'body',
    },
    {
      id: 'closing',
      component: 'Text',
      text: { path: '/closing' },
      variant: 'body',
    },
    {
      id: 'signature',
      component: 'Text',
      text: { path: '/signature' },
      variant: 'body',
    },
    {
      id: 'actions',
      component: 'Row',
      children: ['send-btn', 'discard-btn'],
      gap: 'small',
    },
    {
      id: 'send-btn-text',
      component: 'Text',
      text: 'Send email',
    },
    {
      id: 'send-btn',
      component: 'Button',
      child: 'send-btn-text',
      action: { event: { name: 'send' } },
    },
    {
      id: 'discard-btn-text',
      component: 'Text',
      text: 'Discard',
    },
    {
      id: 'discard-btn',
      component: 'Button',
      child: 'discard-btn-text',
      action: { event: { name: 'discard' } },
    },
  ],
  dataStates: [
    {
      name: 'Default',
      data: {
        from: 'alex@acme.com',
        to: 'jordan@acme.com',
        subject: 'Q4 Revenue Forecast',
        greeting: 'Hi Jordan,',
        body: "Following up on our call. Please review the attached Q4 forecast and let me know if you have questions before the board meeting.",
        closing: 'Best,',
        signature: 'Alex',
      },
    },
    {
      name: 'Meeting Request',
      data: {
        from: 'sarah@company.com',
        to: 'team@company.com',
        subject: 'Budget Approval Required',
        greeting: 'Hi Team,',
        body: "The marketing budget for Q1 needs final approval by Friday. Please submit your department estimates by EOD tomorrow.",
        closing: 'Thanks,',
        signature: 'Sarah',
      },
    },
  ],
};

export const V09_EMAIL_COMPOSE_GALLERY = {
  widget: V09_EMAIL_COMPOSE_WIDGET,
  height: 340,
};
