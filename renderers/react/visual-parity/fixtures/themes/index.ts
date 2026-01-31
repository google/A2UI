/**
 * Theme registry for visual parity tests.
 * Maps theme names to theme objects for URL-based theme selection.
 */

import { litTheme } from '@a2ui/react';
import { visualParityTheme } from './visualParityTheme';
import { minimalTheme } from './minimalTheme';
import type { Types } from '@a2ui/lit/0.8';

/**
 * Registry of themes available for visual parity testing.
 *
 * - `default`: No theme (undefined) - tests fallback/default styling
 * - `lit`: The litTheme from @a2ui/react - default A2UI styling
 * - `visualParity`: Alternate theme with different styling choices
 * - `minimal`: Stripped-down neutral theme for structural testing
 */
export const testThemes: Record<string, Types.Theme | undefined> = {
  default: undefined, // No theme - tests fallback styling
  lit: litTheme,
  visualParity: visualParityTheme,
  minimal: minimalTheme,
};

export type ThemeName = keyof typeof testThemes;
export const themeNames = Object.keys(testThemes) as ThemeName[];

/**
 * Get a theme by name from the registry.
 * Returns undefined for 'default' or unknown theme names.
 */
export function getTheme(name: string | null): Types.Theme | undefined {
  if (!name || !(name in testThemes)) {
    return testThemes.default;
  }
  return testThemes[name];
}

// Re-export individual themes
export { litTheme } from '@a2ui/react';
export { visualParityTheme } from './visualParityTheme';
export { minimalTheme } from './minimalTheme';
