/**
 * AudioPlayer component fixtures for visual parity testing.
 *
 * Note: The `description` property is defined in the A2UI spec but is NOT
 * implemented in the Lit renderer. Only the `url` property is used by Lit.
 * React implements description, but these fixtures only test url for parity.
 */

import type { ComponentFixture } from '../types';

export const audioPlayerBasic: ComponentFixture = {
  root: 'audio-1',
  components: [
    {
      id: 'audio-1',
      component: {
        AudioPlayer: {
          url: { literalString: 'https://www.w3schools.com/html/horse.mp3' },
        },
      },
    },
  ],
};

export const audioPlayerWithPathBinding: ComponentFixture = {
  root: 'audio-2',
  data: {
    '/media/audioUrl': 'https://www.w3schools.com/html/horse.mp3',
  },
  components: [
    {
      id: 'audio-2',
      component: {
        AudioPlayer: {
          url: { path: '/media/audioUrl' },
        },
      },
    },
  ],
};

export const audioPlayerFixtures = {
  audioPlayerBasic,
  audioPlayerWithPathBinding,
};
