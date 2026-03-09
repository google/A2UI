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

// 23. Credit Card Display
export const CREDIT_CARD_WIDGET: Widget = {
  id: 'gallery-credit-card',
  name: 'Credit Card Display',
  description: 'Payment card with masked number and expiry',
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
          children: { explicitList: ['card-type-row', 'card-number', 'card-details'] },
          gap: 'large',
        },
      },
    },
    {
      id: 'card-type-row',
      component: {
        Row: {
          children: { explicitList: ['card-icon', 'card-type'] },
          distribution: 'spaceBetween',
          alignment: 'center',
        },
      },
    },
    {
      id: 'card-icon',
      component: {
        Icon: {
          name: { literalString: 'credit_card' },
        },
      },
    },
    {
      id: 'card-type',
      component: {
        Text: {
          text: { path: '/cardType' },
          usageHint: 'h4',
        },
      },
    },
    {
      id: 'card-number',
      component: {
        Text: {
          text: { path: '/cardNumber' },
          usageHint: 'h2',
        },
      },
    },
    {
      id: 'card-details',
      component: {
        Row: {
          children: { explicitList: ['holder-col', 'expiry-col'] },
          distribution: 'spaceBetween',
        },
      },
    },
    {
      id: 'holder-col',
      component: {
        Column: {
          children: { explicitList: ['holder-label', 'holder-name'] },
        },
      },
    },
    {
      id: 'holder-label',
      component: {
        Text: {
          text: { literalString: 'CARD HOLDER' },
          usageHint: 'caption',
        },
      },
    },
    {
      id: 'holder-name',
      component: {
        Text: {
          text: { path: '/holderName' },
          usageHint: 'body',
        },
      },
    },
    {
      id: 'expiry-col',
      component: {
        Column: {
          children: { explicitList: ['expiry-label', 'expiry-date'] },
          alignment: 'end',
        },
      },
    },
    {
      id: 'expiry-label',
      component: {
        Text: {
          text: { literalString: 'EXPIRES' },
          usageHint: 'caption',
        },
      },
    },
    {
      id: 'expiry-date',
      component: {
        Text: {
          text: { path: '/expiryDate' },
          usageHint: 'body',
        },
      },
    },
  ],
  dataStates: [
    {
      name: 'Default',
      data: {
        cardType: 'VISA',
        cardNumber: '•••• •••• •••• 4242',
        holderName: 'SARAH JOHNSON',
        expiryDate: '09/27',
      },
    },
  ],
};

export const CREDIT_CARD_GALLERY = { widget: CREDIT_CARD_WIDGET, height: 200 };
