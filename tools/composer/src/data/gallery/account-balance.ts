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

export const ACCOUNT_BALANCE_WIDGET: Widget = {
  id: 'gallery-account-balance',
  name: 'Account Balance',
  description: 'Bank account balance display with actions',
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
          children: { explicitList: ['header', 'balance', 'updated', 'divider', 'actions'] },
          gap: 'medium',
        },
      },
    },
    {
      id: 'header',
      component: {
        Row: {
          children: { explicitList: ['account-icon', 'account-name'] },
          gap: 'small',
          alignment: 'center',
        },
      },
    },
    {
      id: 'account-icon',
      component: {
        Icon: {
          name: { literalString: 'account_balance' },
        },
      },
    },
    {
      id: 'account-name',
      component: {
        Text: {
          text: { path: '/accountName' },
          usageHint: 'h4',
        },
      },
    },
    {
      id: 'balance',
      component: {
        Text: {
          text: { path: '/balance' },
          usageHint: 'h1',
        },
      },
    },
    {
      id: 'updated',
      component: {
        Text: {
          text: { path: '/lastUpdated' },
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
      id: 'actions',
      component: {
        Row: {
          children: { explicitList: ['transfer-btn', 'pay-btn'] },
          gap: 'small',
        },
      },
    },
    {
      id: 'transfer-btn-text',
      component: {
        Text: {
          text: { literalString: 'Transfer' },
        },
      },
    },
    {
      id: 'transfer-btn',
      component: {
        Button: {
          child: 'transfer-btn-text',
          action: 'transfer',
        },
      },
    },
    {
      id: 'pay-btn-text',
      component: {
        Text: {
          text: { literalString: 'Pay Bill' },
        },
      },
    },
    {
      id: 'pay-btn',
      component: {
        Button: {
          child: 'pay-btn-text',
          action: 'pay_bill',
        },
      },
    },
  ],
  dataStates: [
    {
      name: 'Default',
      data: {
        accountName: 'Primary Checking',
        balance: '$12,458.32',
        lastUpdated: 'Updated just now',
      },
    },
  ],
};

export const ACCOUNT_BALANCE_GALLERY = { widget: ACCOUNT_BALANCE_WIDGET, height: 240 };
