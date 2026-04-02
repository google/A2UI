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

// 30. Movie Card
export const V09_MOVIE_CARD_WIDGET: Widget = {
  id: 'gallery-v09-movie-card',
  name: 'Movie Card',
  description: 'Movie poster with rating and details',
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
      children: ['poster', 'content'],
      gap: 'small',
    },
    {
      id: 'poster',
      component: 'Image',
      url: { path: '/poster' },
      altText: { path: '/title' },
      fit: 'cover',
    },
    {
      id: 'content',
      component: 'Column',
      children: ['title-row', 'genre', 'rating-row', 'runtime'],
      gap: 'small',
    },
    {
      id: 'title-row',
      component: 'Row',
      children: ['movie-title', 'year'],
      gap: 'small',
      align: 'center',
    },
    {
      id: 'movie-title',
      component: 'Text',
      text: { path: '/title' },
      variant: 'h3',
    },
    {
      id: 'year',
      component: 'Text',
      text: { path: '/year' },
      variant: 'caption',
    },
    {
      id: 'genre',
      component: 'Text',
      text: { path: '/genre' },
      variant: 'caption',
    },
    {
      id: 'rating-row',
      component: 'Row',
      children: ['star-icon', 'rating-value'],
      gap: 'small',
      align: 'center',
    },
    {
      id: 'star-icon',
      component: 'Icon',
      name: 'star',
    },
    {
      id: 'rating-value',
      component: 'Text',
      text: { path: '/rating' },
      variant: 'body',
    },
    {
      id: 'runtime',
      component: 'Row',
      children: ['time-icon', 'runtime-text'],
      gap: 'small',
      align: 'center',
    },
    {
      id: 'time-icon',
      component: 'Icon',
      name: 'schedule',
    },
    {
      id: 'runtime-text',
      component: 'Text',
      text: { path: '/runtime' },
      variant: 'caption',
    },
  ],
  dataStates: [
    {
      name: 'Default',
      data: {
        poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&h=300&fit=crop',
        title: 'Interstellar',
        year: '(2014)',
        genre: 'Sci-Fi \u2022 Adventure \u2022 Drama',
        rating: '8.7/10',
        runtime: '2h 49min',
      },
    },
  ],
};

export const V09_MOVIE_CARD_GALLERY = { widget: V09_MOVIE_CARD_WIDGET, height: 400 };
