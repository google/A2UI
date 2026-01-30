/**
 * TextField component fixtures for visual parity testing.
 */

import type { ComponentFixture } from '../types';

export const textField: ComponentFixture = {
  root: 'tf-1',
  components: [
    {
      id: 'tf-1',
      component: {
        TextField: { label: { literalString: 'Your Name' } },
      },
    },
  ],
};

export const textFieldWithValue: ComponentFixture = {
  root: 'tf-value',
  components: [
    {
      id: 'tf-value',
      component: {
        TextField: {
          label: { literalString: 'Email' },
          text: { literalString: 'user@example.com' },
        },
      },
    },
  ],
};

export const textFieldFixtures = {
  textField,
  textFieldWithValue,
};
