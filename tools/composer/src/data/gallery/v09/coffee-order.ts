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

export const V09_COFFEE_ORDER_WIDGET: Widget = {
  id: 'gallery-v09-coffee-order',
  name: 'Coffee Order',
  description: 'Coffee order summary with items and total',
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
      children: ['header', 'items', 'divider', 'totals', 'actions'],
      gap: 'medium',
    },
    {
      id: 'header',
      component: 'Row',
      children: ['coffee-icon', 'store-name'],
      gap: 'small',
      align: 'center',
    },
    {
      id: 'coffee-icon',
      component: 'Icon',
      name: 'local_cafe',
    },
    {
      id: 'store-name',
      component: 'Text',
      text: { path: '/storeName' },
      variant: 'h3',
    },
    {
      id: 'items',
      component: 'Column',
      children: ['item1', 'item2'],
      gap: 'small',
    },
    {
      id: 'item1',
      component: 'Row',
      children: ['item1-details', 'item1-price'],
      justify: 'spaceBetween',
      align: 'start',
    },
    {
      id: 'item1-details',
      component: 'Column',
      children: ['item1-name', 'item1-size'],
    },
    {
      id: 'item1-name',
      component: 'Text',
      text: { path: '/item1/name' },
      variant: 'body',
    },
    {
      id: 'item1-size',
      component: 'Text',
      text: { path: '/item1/size' },
      variant: 'caption',
    },
    {
      id: 'item1-price',
      component: 'Text',
      text: { path: '/item1/price' },
      variant: 'body',
    },
    {
      id: 'item2',
      component: 'Row',
      children: ['item2-details', 'item2-price'],
      justify: 'spaceBetween',
      align: 'start',
    },
    {
      id: 'item2-details',
      component: 'Column',
      children: ['item2-name', 'item2-size'],
    },
    {
      id: 'item2-name',
      component: 'Text',
      text: { path: '/item2/name' },
      variant: 'body',
    },
    {
      id: 'item2-size',
      component: 'Text',
      text: { path: '/item2/size' },
      variant: 'caption',
    },
    {
      id: 'item2-price',
      component: 'Text',
      text: { path: '/item2/price' },
      variant: 'body',
    },
    {
      id: 'divider',
      component: 'Divider',
    },
    {
      id: 'totals',
      component: 'Column',
      children: ['subtotal-row', 'tax-row', 'total-row'],
      gap: 'small',
    },
    {
      id: 'subtotal-row',
      component: 'Row',
      children: ['subtotal-label', 'subtotal-value'],
      justify: 'spaceBetween',
    },
    {
      id: 'subtotal-label',
      component: 'Text',
      text: 'Subtotal',
      variant: 'caption',
    },
    {
      id: 'subtotal-value',
      component: 'Text',
      text: { path: '/subtotal' },
      variant: 'body',
    },
    {
      id: 'tax-row',
      component: 'Row',
      children: ['tax-label', 'tax-value'],
      justify: 'spaceBetween',
    },
    {
      id: 'tax-label',
      component: 'Text',
      text: 'Tax',
      variant: 'caption',
    },
    {
      id: 'tax-value',
      component: 'Text',
      text: { path: '/tax' },
      variant: 'body',
    },
    {
      id: 'total-row',
      component: 'Row',
      children: ['total-label', 'total-value'],
      justify: 'spaceBetween',
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
      variant: 'h4',
    },
    {
      id: 'actions',
      component: 'Row',
      children: ['purchase-btn', 'add-btn'],
      gap: 'small',
    },
    {
      id: 'purchase-btn-text',
      component: 'Text',
      text: 'Purchase',
    },
    {
      id: 'purchase-btn',
      component: 'Button',
      child: 'purchase-btn-text',
      action: { event: { name: 'purchase' } },
    },
    {
      id: 'add-btn-text',
      component: 'Text',
      text: 'Add to cart',
    },
    {
      id: 'add-btn',
      component: 'Button',
      child: 'add-btn-text',
      action: { event: { name: 'add_to_cart' } },
    },
  ],
  dataStates: [
    {
      name: 'Default',
      data: {
        storeName: 'Sunrise Coffee',
        item1: { name: 'Oat Milk Latte', size: 'Grande, Extra Shot', price: '$6.45' },
        item2: { name: 'Chocolate Croissant', size: 'Warmed', price: '$4.25' },
        subtotal: '$10.70',
        tax: '$0.96',
        total: '$11.66',
      },
    },
  ],
};

export const V09_COFFEE_ORDER_GALLERY = { widget: V09_COFFEE_ORDER_WIDGET, height: 380 };
