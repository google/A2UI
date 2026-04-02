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

// 22. Shipping Status
export const V09_SHIPPING_STATUS_WIDGET: Widget = {
  id: 'gallery-v09-shipping-status',
  name: 'Shipping Status',
  description: 'Package tracking with delivery steps',
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
      children: ['header', 'tracking-number', 'divider', 'steps', 'eta'],
      gap: 'medium',
    },
    {
      id: 'header',
      component: 'Row',
      children: ['package-icon', 'title'],
      gap: 'small',
      align: 'center',
    },
    {
      id: 'package-icon',
      component: 'Icon',
      name: 'package_2',
    },
    {
      id: 'title',
      component: 'Text',
      text: 'Package Status',
      variant: 'h3',
    },
    {
      id: 'tracking-number',
      component: 'Text',
      text: { path: '/trackingNumber' },
      variant: 'caption',
    },
    {
      id: 'divider',
      component: 'Divider',
    },
    {
      id: 'steps',
      component: 'Column',
      children: ['step1', 'step2', 'step3', 'step4'],
      gap: 'small',
    },
    {
      id: 'step1',
      component: 'Row',
      children: ['step1-icon', 'step1-text'],
      gap: 'small',
      align: 'center',
    },
    {
      id: 'step1-icon',
      component: 'Icon',
      name: 'check_circle',
    },
    {
      id: 'step1-text',
      component: 'Text',
      text: 'Order Placed',
      variant: 'body',
    },
    {
      id: 'step2',
      component: 'Row',
      children: ['step2-icon', 'step2-text'],
      gap: 'small',
      align: 'center',
    },
    {
      id: 'step2-icon',
      component: 'Icon',
      name: 'check_circle',
    },
    {
      id: 'step2-text',
      component: 'Text',
      text: 'Shipped',
      variant: 'body',
    },
    {
      id: 'step3',
      component: 'Row',
      children: ['step3-icon', 'step3-text'],
      gap: 'small',
      align: 'center',
    },
    {
      id: 'step3-icon',
      component: 'Icon',
      name: { path: '/currentStepIcon' },
    },
    {
      id: 'step3-text',
      component: 'Text',
      text: 'Out for Delivery',
      variant: 'h4',
    },
    {
      id: 'step4',
      component: 'Row',
      children: ['step4-icon', 'step4-text'],
      gap: 'small',
      align: 'center',
    },
    {
      id: 'step4-icon',
      component: 'Icon',
      name: 'circle',
    },
    {
      id: 'step4-text',
      component: 'Text',
      text: 'Delivered',
      variant: 'caption',
    },
    {
      id: 'eta',
      component: 'Row',
      children: ['eta-icon', 'eta-text'],
      gap: 'small',
      align: 'center',
    },
    {
      id: 'eta-icon',
      component: 'Icon',
      name: 'schedule',
    },
    {
      id: 'eta-text',
      component: 'Text',
      text: { path: '/eta' },
      variant: 'body',
    },
  ],
  dataStates: [
    {
      name: 'Default',
      data: {
        trackingNumber: 'Tracking: 1Z999AA10123456784',
        currentStepIcon: 'local_shipping',
        eta: 'Estimated delivery: Today by 8 PM',
      },
    },
  ],
};

export const V09_SHIPPING_STATUS_GALLERY = { widget: V09_SHIPPING_STATUS_WIDGET, height: 320 };
