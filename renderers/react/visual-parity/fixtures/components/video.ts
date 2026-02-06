/**
 * Video component fixtures for visual parity testing.
 */

import type { ComponentFixture } from '../types';

export const videoBasic: ComponentFixture = {
  root: 'video-1',
  components: [
    {
      id: 'video-1',
      component: {
        Video: {
          url: { literalString: 'https://www.w3schools.com/html/mov_bbb.mp4' },
        },
      },
    },
  ],
};

export const videoWithPathBinding: ComponentFixture = {
  root: 'video-2',
  data: {
    '/media/videoUrl': 'https://www.w3schools.com/html/mov_bbb.mp4',
  },
  components: [
    {
      id: 'video-2',
      component: {
        Video: {
          url: { path: '/media/videoUrl' },
        },
      },
    },
  ],
};

export const videoFixtures = {
  videoBasic,
  videoWithPathBinding,
};
