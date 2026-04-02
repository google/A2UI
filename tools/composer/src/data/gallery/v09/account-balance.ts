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

export const V09_ACCOUNT_BALANCE_WIDGET: Widget = {
  id: 'gallery-v09-account-balance',
  name: 'Account Balance',
  description: 'Bank account balance display with actions',
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
      children: ['header', 'balance', 'updated', 'divider', 'actions'],
      gap: 'medium',
    },
    {
      id: 'header',
      component: 'Row',
      children: ['account-icon', 'account-name'],
      gap: 'small',
      align: 'center',
    },
    {
      id: 'account-icon',
      component: 'Icon',
      name: 'account_balance',
    },
    {
      id: 'account-name',
      component: 'Text',
      text: { path: '/accountName' },
      variant: 'h4',
    },
    {
      id: 'balance',
      component: 'Text',
      text: { path: '/balance' },
      variant: 'h1',
    },
    {
      id: 'updated',
      component: 'Text',
      text: { path: '/lastUpdated' },
      variant: 'caption',
    },
    {
      id: 'divider',
      component: 'Divider',
    },
    {
      id: 'actions',
      component: 'Row',
      children: ['transfer-btn', 'pay-btn'],
      gap: 'small',
    },
    {
      id: 'transfer-btn-text',
      component: 'Text',
      text: 'Transfer',
    },
    {
      id: 'transfer-btn',
      component: 'Button',
      child: 'transfer-btn-text',
      variant: 'primary',
      action: { event: { name: 'transfer' } },
    },
    {
      id: 'pay-btn-text',
      component: 'Text',
      text: 'Pay Bill',
    },
    {
      id: 'pay-btn',
      component: 'Button',
      child: 'pay-btn-text',
      action: { event: { name: 'pay_bill' } },
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

export const V09_ACCOUNT_BALANCE_GALLERY = { widget: V09_ACCOUNT_BALANCE_WIDGET, height: 240 };
