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

// 19. Software Purchase Form
export const V09_SOFTWARE_PURCHASE_WIDGET: Widget = {
  id: 'gallery-v09-software-purchase',
  name: 'Software Purchase Form',
  description: 'Software licensing purchase with options',
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
      children: ['title', 'product-name', 'divider1', 'options', 'divider2', 'total-row', 'actions'],
      gap: 'medium',
    },
    {
      id: 'title',
      component: 'Text',
      text: 'Purchase License',
      variant: 'h3',
    },
    {
      id: 'product-name',
      component: 'Text',
      text: { path: '/productName' },
      variant: 'h2',
    },
    {
      id: 'divider1',
      component: 'Divider',
    },
    {
      id: 'options',
      component: 'Column',
      children: ['seats-row', 'period-row'],
      gap: 'medium',
    },
    {
      id: 'seats-row',
      component: 'Row',
      children: ['seats-label', 'seats-value'],
      justify: 'spaceBetween',
      align: 'center',
    },
    {
      id: 'seats-label',
      component: 'Text',
      text: 'Number of seats',
      variant: 'body',
    },
    {
      id: 'seats-value',
      component: 'Text',
      text: { path: '/seats' },
      variant: 'h4',
    },
    {
      id: 'period-row',
      component: 'Row',
      children: ['period-label', 'period-value'],
      justify: 'spaceBetween',
      align: 'center',
    },
    {
      id: 'period-label',
      component: 'Text',
      text: 'Billing period',
      variant: 'body',
    },
    {
      id: 'period-value',
      component: 'Text',
      text: { path: '/billingPeriod' },
      variant: 'h4',
    },
    {
      id: 'divider2',
      component: 'Divider',
    },
    {
      id: 'total-row',
      component: 'Row',
      children: ['total-label', 'total-value'],
      justify: 'spaceBetween',
      align: 'center',
    },
    {
      id: 'total-label',
      component: 'Text',
      text: 'Total',
      variant: 'h4',
    },
    {
      id: 'total-value',
      component: 'Text',
      text: { path: '/total' },
      variant: 'h2',
    },
    {
      id: 'actions',
      component: 'Row',
      children: ['confirm-btn', 'cancel-btn'],
      gap: 'small',
    },
    {
      id: 'confirm-btn-text',
      component: 'Text',
      text: 'Confirm Purchase',
    },
    {
      id: 'confirm-btn',
      component: 'Button',
      child: 'confirm-btn-text',
      variant: 'primary',
      action: { event: { name: 'confirm' } },
    },
    {
      id: 'cancel-btn-text',
      component: 'Text',
      text: 'Cancel',
    },
    {
      id: 'cancel-btn',
      component: 'Button',
      child: 'cancel-btn-text',
      action: { event: { name: 'cancel' } },
    },
  ],
  dataStates: [
    {
      name: 'Default',
      data: {
        productName: 'Design Suite Pro',
        seats: '10 seats',
        billingPeriod: 'Annual',
        total: '$1,188/year',
      },
    },
  ],
};

export const V09_SOFTWARE_PURCHASE_GALLERY = { widget: V09_SOFTWARE_PURCHASE_WIDGET, height: 340 };
