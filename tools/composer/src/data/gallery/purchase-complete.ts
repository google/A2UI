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

export const PURCHASE_COMPLETE_WIDGET: Widget = {
  id: 'gallery-purchase-complete',
  name: 'Purchase Complete',
  description: 'Order confirmation with product details and delivery info',
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
          children: { explicitList: ['success-icon', 'title', 'product-row', 'divider', 'details-col', 'view-btn'] },
          gap: 'medium',
          alignment: 'center',
        },
      },
    },
    {
      id: 'success-icon',
      component: {
        Icon: {
          name: { literalString: 'check_circle' },
        },
      },
    },
    {
      id: 'title',
      component: {
        Text: {
          text: { literalString: 'Purchase Complete' },
          usageHint: 'h2',
        },
      },
    },
    {
      id: 'product-row',
      component: {
        Row: {
          children: { explicitList: ['product-image', 'product-info'] },
          gap: 'medium',
          alignment: 'center',
        },
      },
    },
    {
      id: 'product-image',
      component: {
        Image: {
          url: { path: '/productImage' },
          altText: { path: '/productName' },
          fit: 'cover',
        },
      },
    },
    {
      id: 'product-info',
      component: {
        Column: {
          children: { explicitList: ['product-name', 'product-price'] },
          gap: 'small',
        },
      },
    },
    {
      id: 'product-name',
      component: {
        Text: {
          text: { path: '/productName' },
          usageHint: 'h4',
        },
      },
    },
    {
      id: 'product-price',
      component: {
        Text: {
          text: { path: '/price' },
          usageHint: 'body',
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
      id: 'details-col',
      component: {
        Column: {
          children: { explicitList: ['delivery-row', 'seller-row'] },
          gap: 'small',
        },
      },
    },
    {
      id: 'delivery-row',
      component: {
        Row: {
          children: { explicitList: ['delivery-icon', 'delivery-text'] },
          gap: 'small',
          alignment: 'center',
        },
      },
    },
    {
      id: 'delivery-icon',
      component: {
        Icon: {
          name: { literalString: 'local_shipping' },
        },
      },
    },
    {
      id: 'delivery-text',
      component: {
        Text: {
          text: { path: '/deliveryDate' },
          usageHint: 'body',
        },
      },
    },
    {
      id: 'seller-row',
      component: {
        Row: {
          children: { explicitList: ['seller-label', 'seller-name'] },
          gap: 'small',
        },
      },
    },
    {
      id: 'seller-label',
      component: {
        Text: {
          text: { literalString: 'Sold by:' },
          usageHint: 'caption',
        },
      },
    },
    {
      id: 'seller-name',
      component: {
        Text: {
          text: { path: '/seller' },
          usageHint: 'body',
        },
      },
    },
    {
      id: 'view-btn-text',
      component: {
        Text: {
          text: { literalString: 'View Order Details' },
        },
      },
    },
    {
      id: 'view-btn',
      component: {
        Button: {
          child: 'view-btn-text',
          action: 'view_details',
        },
      },
    },
  ],
  dataStates: [
    {
      name: 'Default',
      data: {
        productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop',
        productName: 'Wireless Headphones Pro',
        price: '$199.99',
        deliveryDate: 'Arrives Dec 18 - Dec 20',
        seller: 'TechStore Official',
      },
    },
  ],
};

export const PURCHASE_COMPLETE_GALLERY = { widget: PURCHASE_COMPLETE_WIDGET, height: 340 };
