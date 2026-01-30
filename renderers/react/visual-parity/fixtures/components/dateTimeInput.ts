/**
 * DateTimeInput component fixtures for visual parity testing.
 */

import type { ComponentFixture } from '../types';

export const dateTimeInputDate: ComponentFixture = {
  root: 'dt-date',
  components: [
    {
      id: 'dt-date',
      component: {
        DateTimeInput: {
          value: { literalString: '2025-02-15' },
          enableDate: true,
          enableTime: false,
        },
      },
    },
  ],
};

export const dateTimeInputTime: ComponentFixture = {
  root: 'dt-time',
  components: [
    {
      id: 'dt-time',
      component: {
        DateTimeInput: {
          value: { literalString: '14:30' },
          enableDate: false,
          enableTime: true,
        },
      },
    },
  ],
};

export const dateTimeInputBoth: ComponentFixture = {
  root: 'dt-both',
  components: [
    {
      id: 'dt-both',
      component: {
        DateTimeInput: {
          value: { literalString: '2025-02-15T14:30' },
          enableDate: true,
          enableTime: true,
        },
      },
    },
  ],
};

export const dateTimeInputFixtures = {
  dateTimeInputDate,
  dateTimeInputTime,
  dateTimeInputBoth,
};
