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
export const V09_CREDIT_CARD_WIDGET: Widget = {
  id: 'gallery-v09-credit-card',
  name: 'Credit Card Display',
  description: 'Payment card with masked number and expiry',
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
      children: ['card-type-row', 'card-number', 'card-details'],
      gap: 'large',
    },
    {
      id: 'card-type-row',
      component: 'Row',
      children: ['card-icon', 'card-type'],
      justify: 'spaceBetween',
      align: 'center',
    },
    {
      id: 'card-icon',
      component: 'Icon',
      name: 'credit_card',
    },
    {
      id: 'card-type',
      component: 'Text',
      text: { path: '/cardType' },
      variant: 'h4',
    },
    {
      id: 'card-number',
      component: 'Text',
      text: { path: '/cardNumber' },
      variant: 'h2',
    },
    {
      id: 'card-details',
      component: 'Row',
      children: ['holder-col', 'expiry-col'],
      justify: 'spaceBetween',
    },
    {
      id: 'holder-col',
      component: 'Column',
      children: ['holder-label', 'holder-name'],
    },
    {
      id: 'holder-label',
      component: 'Text',
      text: 'CARD HOLDER',
      variant: 'caption',
    },
    {
      id: 'holder-name',
      component: 'Text',
      text: { path: '/holderName' },
      variant: 'body',
    },
    {
      id: 'expiry-col',
      component: 'Column',
      children: ['expiry-label', 'expiry-date'],
      align: 'end',
    },
    {
      id: 'expiry-label',
      component: 'Text',
      text: 'EXPIRES',
      variant: 'caption',
    },
    {
      id: 'expiry-date',
      component: 'Text',
      text: { path: '/expiryDate' },
      variant: 'body',
    },
  ],
  dataStates: [
    {
      name: 'Default',
      data: {
        cardType: 'VISA',
        cardNumber: '\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 4242',
        holderName: 'SARAH JOHNSON',
        expiryDate: '09/27',
      },
    },
  ],
};

export const V09_CREDIT_CARD_GALLERY = { widget: V09_CREDIT_CARD_WIDGET, height: 200 };
