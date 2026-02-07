/**
 * Shared component fixtures for visual parity testing.
 * These fixtures are used by both React and Lit minimal pages.
 */

// Re-export types
export type { ComponentFixture } from './types';

// Import all component fixtures
import {
  textFixtures,
  buttonFixtures,
  iconFixtures,
  imageFixtures,
  dividerFixtures,
  cardFixtures,
  rowFixtures,
  columnFixtures,
  listFixtures,
  tabsFixtures,
  checkboxFixtures,
  textFieldFixtures,
  sliderFixtures,
  dateTimeInputFixtures,
  multipleChoiceFixtures,
  videoFixtures,
  audioPlayerFixtures,
  modalFixtures,
} from './components';

import { nestedFixtures } from './nested';

// Re-export individual fixtures for direct import
export * from './components';
export * from './nested';

// All fixtures aggregated for iteration
export const allFixtures = {
  // Text component (9 fixtures)
  ...textFixtures,
  // Button component (4 fixtures)
  ...buttonFixtures,
  // Icon component (2 fixtures)
  ...iconFixtures,
  // Image component (7 fixtures)
  ...imageFixtures,
  // Divider component (2 fixtures)
  ...dividerFixtures,
  // Card component (3 fixtures)
  ...cardFixtures,
  // Row component (6 fixtures)
  ...rowFixtures,
  // Column component (5 fixtures)
  ...columnFixtures,
  // List component (4 fixtures)
  ...listFixtures,
  // Tabs component (3 fixtures)
  ...tabsFixtures,
  // CheckBox component (3 fixtures)
  ...checkboxFixtures,
  // TextField component (4 fixtures)
  ...textFieldFixtures,
  // Slider component (3 fixtures)
  ...sliderFixtures,
  // DateTimeInput component (3 fixtures)
  ...dateTimeInputFixtures,
  // MultipleChoice component (4 fixtures)
  ...multipleChoiceFixtures,
  // Video component (2 fixtures)
  ...videoFixtures,
  // AudioPlayer component (3 fixtures)
  ...audioPlayerFixtures,
  // Modal component (2 fixtures)
  ...modalFixtures,
  // Nested layouts (7 fixtures)
  ...nestedFixtures,
} as const;

export type FixtureName = keyof typeof allFixtures;

// Get list of all fixture names
export const fixtureNames = Object.keys(allFixtures) as FixtureName[];

// Get fixture count
export const fixtureCount = fixtureNames.length;
