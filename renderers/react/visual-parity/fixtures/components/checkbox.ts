/**
 * CheckBox component fixtures for visual parity testing.
 *
 * A2UI CheckBox requires binding via path (not literalBoolean).
 * The value is read from the data model and two-way bound.
 */

import type { ComponentFixture } from '../types';

export const checkboxUnchecked: ComponentFixture = {
  root: 'cb-1',
  data: {
    '/checkbox/unchecked': false,
  },
  components: [
    {
      id: 'cb-1',
      component: {
        CheckBox: {
          label: { literalString: 'Unchecked option' },
          value: { path: '/checkbox/unchecked' },
        },
      },
    },
  ],
};

export const checkboxChecked: ComponentFixture = {
  root: 'cb-2',
  data: {
    '/checkbox/checked': true,
  },
  components: [
    {
      id: 'cb-2',
      component: {
        CheckBox: {
          label: { literalString: 'Checked option' },
          value: { path: '/checkbox/checked' },
        },
      },
    },
  ],
};

export const checkboxLongLabel: ComponentFixture = {
  root: 'cb-long',
  data: {
    '/checkbox/longLabel': false,
  },
  components: [
    {
      id: 'cb-long',
      component: {
        CheckBox: {
          label: { literalString: 'I agree to the terms and conditions of service and privacy policy' },
          value: { path: '/checkbox/longLabel' },
        },
      },
    },
  ],
};

export const checkboxFixtures = {
  checkboxUnchecked,
  checkboxChecked,
  checkboxLongLabel,
};
