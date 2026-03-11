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

// 25. Recipe Card
export const RECIPE_CARD_WIDGET: Widget = {
  id: 'gallery-recipe-card',
  name: 'Recipe Card',
  description: 'Recipe preview with image and cooking details',
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
          children: { explicitList: ['recipe-image', 'content'] },
          gap: 'small',
        },
      },
    },
    {
      id: 'recipe-image',
      component: {
        Image: {
          url: { path: '/image' },
          altText: { path: '/title' },
          fit: 'cover',
        },
      },
    },
    {
      id: 'content',
      component: {
        Column: {
          children: { explicitList: ['title', 'rating-row', 'times-row', 'servings'] },
          gap: 'small',
        },
      },
    },
    {
      id: 'title',
      component: {
        Text: {
          text: { path: '/title' },
          usageHint: 'h3',
        },
      },
    },
    {
      id: 'rating-row',
      component: {
        Row: {
          children: { explicitList: ['star-icon', 'rating', 'review-count'] },
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
      id: 'review-count',
      component: {
        Text: {
          text: { path: '/reviewCount' },
          usageHint: 'caption',
        },
      },
    },
    {
      id: 'times-row',
      component: {
        Row: {
          children: { explicitList: ['prep-time', 'cook-time'] },
          gap: 'medium',
        },
      },
    },
    {
      id: 'prep-time',
      component: {
        Row: {
          children: { explicitList: ['prep-icon', 'prep-text'] },
          gap: 'small',
          alignment: 'center',
        },
      },
    },
    {
      id: 'prep-icon',
      component: {
        Icon: {
          name: { literalString: 'timer' },
        },
      },
    },
    {
      id: 'prep-text',
      component: {
        Text: {
          text: { path: '/prepTime' },
          usageHint: 'caption',
        },
      },
    },
    {
      id: 'cook-time',
      component: {
        Row: {
          children: { explicitList: ['cook-icon', 'cook-text'] },
          gap: 'small',
          alignment: 'center',
        },
      },
    },
    {
      id: 'cook-icon',
      component: {
        Icon: {
          name: { literalString: 'local_fire_department' },
        },
      },
    },
    {
      id: 'cook-text',
      component: {
        Text: {
          text: { path: '/cookTime' },
          usageHint: 'caption',
        },
      },
    },
    {
      id: 'servings',
      component: {
        Text: {
          text: { path: '/servings' },
          usageHint: 'caption',
        },
      },
    },
  ],
  dataStates: [
    {
      name: 'Default',
      data: {
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=180&fit=crop',
        title: 'Mediterranean Quinoa Bowl',
        rating: '4.9',
        reviewCount: '(1,247 reviews)',
        prepTime: '15 min prep',
        cookTime: '20 min cook',
        servings: 'Serves 4',
      },
    },
  ],
};

export const RECIPE_CARD_GALLERY = { widget: RECIPE_CARD_WIDGET, height: 280 };
