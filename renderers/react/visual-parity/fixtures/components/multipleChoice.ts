/**
 * MultipleChoice component fixtures for visual parity testing.
 *
 * Lit MultipleChoice format:
 * - selections: { path?: string, literalArray?: string[] } - Required, stores selected values
 * - options: { label: StringValue, value: string }[] - Option definitions
 * - maxAllowedSelections: number - 1 = radio buttons, >1 = checkboxes
 */

import type { ComponentFixture } from '../types';

export const multipleChoiceRadio: ComponentFixture = {
  root: 'mc-radio',
  components: [
    {
      id: 'mc-radio',
      component: {
        MultipleChoice: {
          // Note: Using path because Lit renderer has a bug with literalArray
          // It unconditionally accesses selections.path without checking if it exists
          selections: { path: '/mcRadioSelections' },
          options: [
            { value: 'option1', label: { literalString: 'Option 1' } },
            { value: 'option2', label: { literalString: 'Option 2' } },
            { value: 'option3', label: { literalString: 'Option 3' } },
          ],
          maxAllowedSelections: 1,
        },
      },
    },
  ],
};

export const multipleChoiceCheckbox: ComponentFixture = {
  root: 'mc-check',
  components: [
    {
      id: 'mc-check',
      component: {
        MultipleChoice: {
          selections: { path: '/mcCheckSelections' },
          options: [
            { value: 'a', label: { literalString: 'Feature A' } },
            { value: 'b', label: { literalString: 'Feature B' } },
            { value: 'c', label: { literalString: 'Feature C' } },
          ],
          maxAllowedSelections: 3,
        },
      },
    },
  ],
};

export const multipleChoicePreselected: ComponentFixture = {
  root: 'mc-pre',
  components: [
    {
      id: 'mc-pre',
      component: {
        MultipleChoice: {
          selections: { path: '/mcPreSelections' },
          options: [
            { value: 'small', label: { literalString: 'Small' } },
            { value: 'medium', label: { literalString: 'Medium' } },
            { value: 'large', label: { literalString: 'Large' } },
          ],
          maxAllowedSelections: 1,
        },
      },
    },
  ],
};

export const multipleChoiceMultiPreselected: ComponentFixture = {
  root: 'mc-multi-pre',
  components: [
    {
      id: 'mc-multi-pre',
      component: {
        MultipleChoice: {
          selections: { path: '/mcMultiSelections' },
          options: [
            { value: 'cheese', label: { literalString: 'Cheese' } },
            { value: 'pepperoni', label: { literalString: 'Pepperoni' } },
            { value: 'mushrooms', label: { literalString: 'Mushrooms' } },
            { value: 'onions', label: { literalString: 'Onions' } },
          ],
          maxAllowedSelections: 4,
        },
      },
    },
  ],
};

export const multipleChoiceFixtures = {
  multipleChoiceRadio,
  multipleChoiceCheckbox,
  multipleChoicePreselected,
  multipleChoiceMultiPreselected,
};
