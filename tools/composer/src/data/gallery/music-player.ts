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

export const MUSIC_PLAYER_WIDGET: Widget = {
  id: 'gallery-music-player',
  name: 'Music Player',
  description: 'Now playing interface with playback controls',
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
          children: { explicitList: ['album-art', 'track-info', 'progress', 'time-row', 'controls'] },
          gap: 'small',
          alignment: 'center',
        },
      },
    },
    {
      id: 'album-art',
      component: {
        Image: {
          url: { path: '/albumArt' },
          altText: { path: '/album' },
          fit: 'cover',
        },
      },
    },
    {
      id: 'track-info',
      component: {
        Column: {
          children: { explicitList: ['song-title', 'artist'] },
          alignment: 'center',
        },
      },
    },
    {
      id: 'song-title',
      component: {
        Text: {
          text: { path: '/title' },
          usageHint: 'h3',
        },
      },
    },
    {
      id: 'artist',
      component: {
        Text: {
          text: { path: '/artist' },
          usageHint: 'caption',
        },
      },
    },
    {
      id: 'progress',
      component: {
        ProgressBar: {
          progress: { path: '/progress' },
        },
      },
    },
    {
      id: 'time-row',
      component: {
        Row: {
          children: { explicitList: ['current-time', 'total-time'] },
          distribution: 'spaceBetween',
        },
      },
    },
    {
      id: 'current-time',
      component: {
        Text: {
          text: { path: '/currentTime' },
          usageHint: 'caption',
        },
      },
    },
    {
      id: 'total-time',
      component: {
        Text: {
          text: { path: '/totalTime' },
          usageHint: 'caption',
        },
      },
    },
    {
      id: 'controls',
      component: {
        Row: {
          children: { explicitList: ['prev-btn', 'play-btn', 'next-btn'] },
          distribution: 'center',
          gap: 'medium',
        },
      },
    },
    {
      id: 'prev-btn-text',
      component: {
        Text: {
          text: { literalString: '⏮' },
        },
      },
    },
    {
      id: 'prev-btn',
      component: {
        Button: {
          child: 'prev-btn-text',
          action: 'previous',
        },
      },
    },
    {
      id: 'play-btn-text',
      component: {
        Text: {
          text: { path: '/playIcon' },
        },
      },
    },
    {
      id: 'play-btn',
      component: {
        Button: {
          child: 'play-btn-text',
          action: 'playPause',
        },
      },
    },
    {
      id: 'next-btn-text',
      component: {
        Text: {
          text: { literalString: '⏭' },
        },
      },
    },
    {
      id: 'next-btn',
      component: {
        Button: {
          child: 'next-btn-text',
          action: 'next',
        },
      },
    },
  ],
  dataStates: [
    {
      name: 'Playing',
      data: {
        albumArt: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
        title: 'Blinding Lights',
        artist: 'The Weeknd',
        album: 'After Hours',
        progress: 0.45,
        currentTime: '1:48',
        totalTime: '4:22',
        playIcon: '⏸',
      },
    },
    {
      name: 'Paused',
      data: {
        albumArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
        title: 'Starboy',
        artist: 'The Weeknd ft. Daft Punk',
        album: 'Starboy',
        progress: 0.72,
        currentTime: '2:45',
        totalTime: '3:50',
        playIcon: '▶',
      },
    },
  ],
};

export const MUSIC_PLAYER_GALLERY = {
  widget: MUSIC_PLAYER_WIDGET,
  height: 340,
};
