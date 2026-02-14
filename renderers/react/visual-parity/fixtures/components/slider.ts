/**
 * Slider component fixtures for visual parity testing.
 *
 * Note: label is not part of the standard A2UI Slider specification.
 * Using path bindings for values to match the A2UI data model pattern.
 */

import type { ComponentFixture } from '../types';

export const slider: ComponentFixture = {
  root: 'slider-1',
  data: {
    '/slider/value': 50,
  },
  components: [
    {
      id: 'slider-1',
      component: {
        Slider: {
          value: { path: '/slider/value' },
          minValue: 0,
          maxValue: 100,
        },
      },
    },
  ],
};

export const sliderFixtures = {
  slider,
};
