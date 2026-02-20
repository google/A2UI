/**
 * MultipleChoice component fixtures for visual parity testing.
 *
 * Both Lit and React render a <select> dropdown with a description label.
 * A single fixture is sufficient since maxAllowedSelections does not
 * affect the visual rendering (always a dropdown).
 */

import type { ComponentFixture } from '../types';

export const multipleChoice: ComponentFixture = {
  root: 'mc-1',
  components: [
    {
      id: 'mc-1',
      component: {
        MultipleChoice: {
          selections: { path: '/mcSelections' },
          options: [
            { value: 'option1', label: { literalString: 'Option 1' } },
            { value: 'option2', label: { literalString: 'Option 2' } },
            { value: 'option3', label: { literalString: 'Option 3' } },
          ],
        },
      },
    },
  ],
};

export const multipleChoiceFixtures = {
  multipleChoice,
};
