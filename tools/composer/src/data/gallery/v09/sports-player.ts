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

export const V09_SPORTS_PLAYER_WIDGET: Widget = {
  id: 'gallery-v09-sports-player',
  name: 'Sports Player Card',
  description: 'Player profile with photo and stats',
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
      children: ['player-image', 'player-info', 'divider', 'stats-row'],
      gap: 'medium',
      align: 'center',
    },
    {
      id: 'player-image',
      component: 'Image',
      url: { path: '/playerImage' },
      altText: { path: '/playerName' },
      fit: 'cover',
    },
    {
      id: 'player-info',
      component: 'Column',
      children: ['player-name', 'player-details'],
      align: 'center',
    },
    {
      id: 'player-name',
      component: 'Text',
      text: { path: '/playerName' },
      variant: 'h2',
    },
    {
      id: 'player-details',
      component: 'Row',
      children: ['player-number', 'player-team'],
      gap: 'small',
      align: 'center',
    },
    {
      id: 'player-number',
      component: 'Text',
      text: { path: '/number' },
      variant: 'h3',
    },
    {
      id: 'player-team',
      component: 'Text',
      text: { path: '/team' },
      variant: 'caption',
    },
    {
      id: 'divider',
      component: 'Divider',
    },
    {
      id: 'stats-row',
      component: 'Row',
      children: ['stat1', 'stat2', 'stat3'],
      justify: 'spaceAround',
    },
    {
      id: 'stat1',
      component: 'Column',
      children: ['stat1-value', 'stat1-label'],
      align: 'center',
    },
    {
      id: 'stat1-value',
      component: 'Text',
      text: { path: '/stat1/value' },
      variant: 'h3',
    },
    {
      id: 'stat1-label',
      component: 'Text',
      text: { path: '/stat1/label' },
      variant: 'caption',
    },
    {
      id: 'stat2',
      component: 'Column',
      children: ['stat2-value', 'stat2-label'],
      align: 'center',
    },
    {
      id: 'stat2-value',
      component: 'Text',
      text: { path: '/stat2/value' },
      variant: 'h3',
    },
    {
      id: 'stat2-label',
      component: 'Text',
      text: { path: '/stat2/label' },
      variant: 'caption',
    },
    {
      id: 'stat3',
      component: 'Column',
      children: ['stat3-value', 'stat3-label'],
      align: 'center',
    },
    {
      id: 'stat3-value',
      component: 'Text',
      text: { path: '/stat3/value' },
      variant: 'h3',
    },
    {
      id: 'stat3-label',
      component: 'Text',
      text: { path: '/stat3/label' },
      variant: 'caption',
    },
  ],
  dataStates: [
    {
      name: 'Default',
      data: {
        playerImage: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=200&h=200&fit=crop',
        playerName: 'Marcus Johnson',
        number: '#23',
        team: 'LA Lakers',
        stat1: { value: '28.4', label: 'PPG' },
        stat2: { value: '7.2', label: 'RPG' },
        stat3: { value: '6.8', label: 'APG' },
      },
    },
  ],
};

export const V09_SPORTS_PLAYER_GALLERY = { widget: V09_SPORTS_PLAYER_WIDGET, height: 360 };
