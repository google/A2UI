/**
 * Icon component fixtures for visual parity testing.
 */

import type { ComponentFixture } from '../types';

export const icon: ComponentFixture = {
  root: 'icon-1',
  components: [
    {
      id: 'icon-1',
      component: {
        Icon: { name: { literalString: 'home' } },
      },
    },
  ],
};

export const iconMultiple: ComponentFixture = {
  root: 'icons-row',
  components: [
    { id: 'icon-home', component: { Icon: { name: { literalString: 'home' } } } },
    { id: 'icon-search', component: { Icon: { name: { literalString: 'search' } } } },
    { id: 'icon-settings', component: { Icon: { name: { literalString: 'settings' } } } },
    { id: 'icon-favorite', component: { Icon: { name: { literalString: 'favorite' } } } },
    { id: 'icon-star', component: { Icon: { name: { literalString: 'star' } } } },
    {
      id: 'icons-row',
      component: {
        Row: { children: { explicitList: ['icon-home', 'icon-search', 'icon-settings', 'icon-favorite', 'icon-star'] } },
      },
    },
  ],
};

export const iconFixtures = {
  icon,
  iconMultiple,
};
