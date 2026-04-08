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

// 20. Restaurant Card
export const RESTAURANT_CARD_WIDGET: Widget = {
  id: 'gallery-restaurant-card',
  name: 'Restaurant Card',
  description: 'Restaurant listing with rating and details',
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
          children: { explicitList: ['restaurant-image', 'content'] },
          gap: 'small',
        },
      },
    },
    {
      id: 'restaurant-image',
      component: {
        Image: {
          url: { path: '/image' },
          altText: { path: '/name' },
          fit: 'cover',
        },
      },
    },
    {
      id: 'content',
      component: {
        Column: {
          children: { explicitList: ['name-row', 'cuisine', 'rating-row', 'details-row'] },
          gap: 'small',
        },
      },
    },
    {
      id: 'name-row',
      component: {
        Row: {
          children: { explicitList: ['restaurant-name', 'price-range'] },
          distribution: 'spaceBetween',
          alignment: 'center',
        },
      },
    },
    {
      id: 'restaurant-name',
      component: {
        Text: {
          text: { path: '/name' },
          usageHint: 'h3',
        },
      },
    },
    {
      id: 'price-range',
      component: {
        Text: {
          text: { path: '/priceRange' },
          usageHint: 'body',
        },
      },
    },
    {
      id: 'cuisine',
      component: {
        Text: {
          text: { path: '/cuisine' },
          usageHint: 'caption',
        },
      },
    },
    {
      id: 'rating-row',
      component: {
        Row: {
          children: { explicitList: ['star-icon', 'rating', 'reviews'] },
          gap: 'small',
          alignment: 'center',
        },
      },
    },
    {
      id: 'star-icon',
      component: {
        Icon: {
          name: { literalString: 'star' },
        },
      },
    },
    {
      id: 'rating',
      component: {
        Text: {
          text: { path: '/rating' },
          usageHint: 'body',
        },
      },
    },
    {
      id: 'reviews',
      component: {
        Text: {
          text: { path: '/reviewCount' },
          usageHint: 'caption',
        },
      },
    },
    {
      id: 'details-row',
      component: {
        Row: {
          children: { explicitList: ['distance', 'delivery-time'] },
          gap: 'medium',
        },
      },
    },
    {
      id: 'distance',
      component: {
        Text: {
          text: { path: '/distance' },
          usageHint: 'caption',
        },
      },
    },
    {
      id: 'delivery-time',
      component: {
        Text: {
          text: { path: '/deliveryTime' },
          usageHint: 'caption',
        },
      },
    },
  ],
  dataStates: [
    {
      name: 'Default',
      data: {
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=150&fit=crop',
        name: 'The Italian Kitchen',
        priceRange: '$$$',
        cuisine: 'Italian • Pasta • Wine Bar',
        rating: '4.8',
        reviewCount: '(2,847 reviews)',
        distance: '0.8 mi',
        deliveryTime: '25-35 min',
      },
    },
  ],
};

export const RESTAURANT_CARD_GALLERY = { widget: RESTAURANT_CARD_WIDGET, height: 340 };
