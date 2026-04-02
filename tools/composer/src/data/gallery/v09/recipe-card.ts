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
export const V09_RECIPE_CARD_WIDGET: Widget = {
  id: 'gallery-v09-recipe-card',
  name: 'Recipe Card',
  description: 'Recipe preview with image and cooking details',
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
      children: ['recipe-image', 'content'],
      gap: 'small',
    },
    {
      id: 'recipe-image',
      component: 'Image',
      url: { path: '/image' },
      altText: { path: '/title' },
      fit: 'cover',
    },
    {
      id: 'content',
      component: 'Column',
      children: ['title', 'rating-row', 'times-row', 'servings'],
      gap: 'small',
    },
    {
      id: 'title',
      component: 'Text',
      text: { path: '/title' },
      variant: 'h3',
    },
    {
      id: 'rating-row',
      component: 'Row',
      children: ['star-icon', 'rating', 'review-count'],
      gap: 'small',
      align: 'center',
    },
    {
      id: 'star-icon',
      component: 'Icon',
      name: 'star',
    },
    {
      id: 'rating',
      component: 'Text',
      text: { path: '/rating' },
      variant: 'body',
    },
    {
      id: 'review-count',
      component: 'Text',
      text: { path: '/reviewCount' },
      variant: 'caption',
    },
    {
      id: 'times-row',
      component: 'Row',
      children: ['prep-time', 'cook-time'],
      gap: 'medium',
    },
    {
      id: 'prep-time',
      component: 'Row',
      children: ['prep-icon', 'prep-text'],
      gap: 'small',
      align: 'center',
    },
    {
      id: 'prep-icon',
      component: 'Icon',
      name: 'timer',
    },
    {
      id: 'prep-text',
      component: 'Text',
      text: { path: '/prepTime' },
      variant: 'caption',
    },
    {
      id: 'cook-time',
      component: 'Row',
      children: ['cook-icon', 'cook-text'],
      gap: 'small',
      align: 'center',
    },
    {
      id: 'cook-icon',
      component: 'Icon',
      name: 'local_fire_department',
    },
    {
      id: 'cook-text',
      component: 'Text',
      text: { path: '/cookTime' },
      variant: 'caption',
    },
    {
      id: 'servings',
      component: 'Text',
      text: { path: '/servings' },
      variant: 'caption',
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

export const V09_RECIPE_CARD_GALLERY = { widget: V09_RECIPE_CARD_WIDGET, height: 280 };
