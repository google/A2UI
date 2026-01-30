/**
 * Divider component fixtures for visual parity testing.
 */

import type { ComponentFixture } from '../types';

export const dividerHorizontal: ComponentFixture = {
  root: 'div-h',
  components: [
    {
      id: 'div-h',
      component: {
        Divider: {},
      },
    },
  ],
};

export const dividerVertical: ComponentFixture = {
  root: 'div-v',
  components: [
    {
      id: 'div-v',
      component: {
        Divider: { axis: 'vertical' },
      },
    },
  ],
};

export const dividerFixtures = {
  dividerHorizontal,
  dividerVertical,
};
