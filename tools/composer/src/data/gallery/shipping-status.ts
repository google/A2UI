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
export const SHIPPING_STATUS_WIDGET: Widget = {
  id: 'gallery-shipping-status',
  name: 'Shipping Status',
  description: 'Package tracking with delivery steps',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  root: 'root',
  components: [
    {
      id: 'root',
      component: {
        Card: {
          child: 'main-column',
        },
      },
    },
    {
      id: 'main-column',
      component: {
        Column: {
          children: { explicitList: ['header', 'tracking-number', 'divider', 'steps', 'eta'] },
          gap: 'medium',
        },
      },
    },
    {
      id: 'header',
      component: {
        Row: {
          children: { explicitList: ['package-icon', 'title'] },
          gap: 'small',
          alignment: 'center',
        },
      },
    },
    {
      id: 'package-icon',
      component: {
        Icon: {
          name: { literalString: 'package_2' },
        },
      },
    },
    {
      id: 'title',
      component: {
        Text: {
          text: { literalString: 'Package Status' },
          usageHint: 'h3',
        },
      },
    },
    {
      id: 'tracking-number',
      component: {
        Text: {
          text: { path: '/trackingNumber' },
          usageHint: 'caption',
        },
      },
    },
    {
      id: 'divider',
      component: {
        Divider: {},
      },
    },
    {
      id: 'steps',
      component: {
        Column: {
          children: { explicitList: ['step1', 'step2', 'step3', 'step4'] },
          gap: 'small',
        },
      },
    },
    {
      id: 'step1',
      component: {
        Row: {
          children: { explicitList: ['step1-icon', 'step1-text'] },
          gap: 'small',
          alignment: 'center',
        },
      },
    },
    {
      id: 'step1-icon',
      component: {
        Icon: {
          name: { literalString: 'check_circle' },
        },
      },
    },
    {
      id: 'step1-text',
      component: {
        Text: {
          text: { literalString: 'Order Placed' },
          usageHint: 'body',
        },
      },
    },
    {
      id: 'step2',
      component: {
        Row: {
          children: { explicitList: ['step2-icon', 'step2-text'] },
          gap: 'small',
          alignment: 'center',
        },
      },
    },
    {
      id: 'step2-icon',
      component: {
        Icon: {
          name: { literalString: 'check_circle' },
        },
      },
    },
    {
      id: 'step2-text',
      component: {
        Text: {
          text: { literalString: 'Shipped' },
          usageHint: 'body',
        },
      },
    },
    {
      id: 'step3',
      component: {
        Row: {
          children: { explicitList: ['step3-icon', 'step3-text'] },
          gap: 'small',
          alignment: 'center',
        },
      },
    },
    {
      id: 'step3-icon',
      component: {
        Icon: {
          name: { path: '/currentStepIcon' },
        },
      },
    },
    {
      id: 'step3-text',
      component: {
        Text: {
          text: { literalString: 'Out for Delivery' },
          usageHint: 'h4',
        },
      },
    },
    {
      id: 'step4',
      component: {
        Row: {
          children: { explicitList: ['step4-icon', 'step4-text'] },
          gap: 'small',
          alignment: 'center',
        },
      },
    },
    {
      id: 'step4-icon',
      component: {
        Icon: {
          name: { literalString: 'circle' },
        },
      },
    },
    {
      id: 'step4-text',
      component: {
        Text: {
          text: { literalString: 'Delivered' },
          usageHint: 'caption',
        },
      },
    },
    {
      id: 'eta',
      component: {
        Row: {
          children: { explicitList: ['eta-icon', 'eta-text'] },
          gap: 'small',
          alignment: 'center',
        },
      },
    },
    {
      id: 'eta-icon',
      component: {
        Icon: {
          name: { literalString: 'schedule' },
        },
      },
    },
    {
      id: 'eta-text',
      component: {
        Text: {
          text: { path: '/eta' },
          usageHint: 'body',
        },
      },
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

export const SHIPPING_STATUS_GALLERY = { widget: SHIPPING_STATUS_WIDGET, height: 320 };
