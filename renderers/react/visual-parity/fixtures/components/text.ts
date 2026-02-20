/**
 * Text component fixtures for visual parity testing.
 */

import type { ComponentFixture } from '../types';

export const textBasic: ComponentFixture = {
  root: 'text-1',
  components: [
    {
      id: 'text-1',
      component: {
        Text: { text: { literalString: 'Hello, this is basic text.' } },
      },
    },
  ],
};

export const textH1: ComponentFixture = {
  root: 'text-h1',
  components: [
    {
      id: 'text-h1',
      component: {
        Text: { text: { literalString: 'Heading 1' }, usageHint: 'h1' },
      },
    },
  ],
};

export const textH2: ComponentFixture = {
  root: 'text-h2',
  components: [
    {
      id: 'text-h2',
      component: {
        Text: { text: { literalString: 'Heading 2' }, usageHint: 'h2' },
      },
    },
  ],
};

export const textH3: ComponentFixture = {
  root: 'text-h3',
  components: [
    {
      id: 'text-h3',
      component: {
        Text: { text: { literalString: 'Heading 3' }, usageHint: 'h3' },
      },
    },
  ],
};

export const textH4: ComponentFixture = {
  root: 'text-h4',
  components: [
    {
      id: 'text-h4',
      component: {
        Text: { text: { literalString: 'Heading 4' }, usageHint: 'h4' },
      },
    },
  ],
};

export const textH5: ComponentFixture = {
  root: 'text-h5',
  components: [
    {
      id: 'text-h5',
      component: {
        Text: { text: { literalString: 'Heading 5' }, usageHint: 'h5' },
      },
    },
  ],
};

export const textBody: ComponentFixture = {
  root: 'text-body',
  components: [
    {
      id: 'text-body',
      component: {
        Text: { text: { literalString: 'Body text content goes here.' }, usageHint: 'body' },
      },
    },
  ],
};

export const textCaption: ComponentFixture = {
  root: 'text-caption',
  components: [
    {
      id: 'text-caption',
      component: {
        Text: { text: { literalString: 'Caption text' }, usageHint: 'caption' },
      },
    },
  ],
};

export const textFixtures = {
  textBasic,
  textH1,
  textH2,
  textH3,
  textH4,
  textH5,
  textBody,
  textCaption,
};
