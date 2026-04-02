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

// 18. Track List
export const V09_TRACK_LIST_WIDGET: Widget = {
  id: 'gallery-v09-track-list',
  name: 'Track List',
  description: 'Music playlist with track items',
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
      children: ['header', 'divider', 'tracks'],
      gap: 'small',
    },
    {
      id: 'header',
      component: 'Row',
      children: ['playlist-icon', 'playlist-name'],
      gap: 'small',
      align: 'center',
    },
    {
      id: 'playlist-icon',
      component: 'Icon',
      name: 'queue_music',
    },
    {
      id: 'playlist-name',
      component: 'Text',
      text: { path: '/playlistName' },
      variant: 'h3',
    },
    {
      id: 'divider',
      component: 'Divider',
    },
    {
      id: 'tracks',
      component: 'Column',
      children: ['track1', 'track2', 'track3'],
      gap: 'small',
    },
    {
      id: 'track1',
      component: 'Row',
      children: ['track1-num', 'track1-art', 'track1-info', 'track1-duration'],
      gap: 'small',
      align: 'center',
    },
    {
      id: 'track1-num',
      component: 'Text',
      text: '1',
      variant: 'caption',
    },
    {
      id: 'track1-art',
      component: 'Image',
      url: { path: '/track1/art' },
      altText: { path: '/track1/title' },
      fit: 'cover',
    },
    {
      id: 'track1-info',
      component: 'Column',
      children: ['track1-title', 'track1-artist'],
    },
    {
      id: 'track1-title',
      component: 'Text',
      text: { path: '/track1/title' },
      variant: 'body',
    },
    {
      id: 'track1-artist',
      component: 'Text',
      text: { path: '/track1/artist' },
      variant: 'caption',
    },
    {
      id: 'track1-duration',
      component: 'Text',
      text: { path: '/track1/duration' },
      variant: 'caption',
    },
    {
      id: 'track2',
      component: 'Row',
      children: ['track2-num', 'track2-art', 'track2-info', 'track2-duration'],
      gap: 'small',
      align: 'center',
    },
    {
      id: 'track2-num',
      component: 'Text',
      text: '2',
      variant: 'caption',
    },
    {
      id: 'track2-art',
      component: 'Image',
      url: { path: '/track2/art' },
      altText: { path: '/track2/title' },
      fit: 'cover',
    },
    {
      id: 'track2-info',
      component: 'Column',
      children: ['track2-title', 'track2-artist'],
    },
    {
      id: 'track2-title',
      component: 'Text',
      text: { path: '/track2/title' },
      variant: 'body',
    },
    {
      id: 'track2-artist',
      component: 'Text',
      text: { path: '/track2/artist' },
      variant: 'caption',
    },
    {
      id: 'track2-duration',
      component: 'Text',
      text: { path: '/track2/duration' },
      variant: 'caption',
    },
    {
      id: 'track3',
      component: 'Row',
      children: ['track3-num', 'track3-art', 'track3-info', 'track3-duration'],
      gap: 'small',
      align: 'center',
    },
    {
      id: 'track3-num',
      component: 'Text',
      text: '3',
      variant: 'caption',
    },
    {
      id: 'track3-art',
      component: 'Image',
      url: { path: '/track3/art' },
      altText: { path: '/track3/title' },
      fit: 'cover',
    },
    {
      id: 'track3-info',
      component: 'Column',
      children: ['track3-title', 'track3-artist'],
    },
    {
      id: 'track3-title',
      component: 'Text',
      text: { path: '/track3/title' },
      variant: 'body',
    },
    {
      id: 'track3-artist',
      component: 'Text',
      text: { path: '/track3/artist' },
      variant: 'caption',
    },
    {
      id: 'track3-duration',
      component: 'Text',
      text: { path: '/track3/duration' },
      variant: 'caption',
    },
  ],
  dataStates: [
    {
      name: 'Default',
      data: {
        playlistName: 'Focus Flow',
        track1: {
          art: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=50&h=50&fit=crop',
          title: 'Weightless',
          artist: 'Marconi Union',
          duration: '8:09',
        },
        track2: {
          art: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=50&h=50&fit=crop',
          title: 'Clair de Lune',
          artist: 'Debussy',
          duration: '5:12',
        },
        track3: {
          art: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=50&h=50&fit=crop',
          title: 'Ambient Light',
          artist: 'Brian Eno',
          duration: '6:45',
        },
      },
    },
  ],
};

export const V09_TRACK_LIST_GALLERY = { widget: V09_TRACK_LIST_WIDGET, height: 320 };
