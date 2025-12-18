/**
 * Theme mode type - matches the one exported by @a2ui/react
 */
export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * Theme utilities for A2UI React sample app.
 * 
 * This module provides helpers for managing Semi Design theming
 * in conjunction with A2UI's ThemeProvider.
 */

/**
 * Apply theme mode to the document body.
 * This sets the Semi Design theme attribute.
 */
export function applyThemeMode(mode: ThemeMode): void {
  if (mode === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.setAttribute('theme-mode', prefersDark ? 'dark' : 'light');
  } else {
    document.body.setAttribute('theme-mode', mode);
  }
}

/**
 * Get the initial theme mode based on system preference or saved preference.
 */
export function getInitialThemeMode(): ThemeMode {
  // Check if theme-mode is already set
  const themeMode = document.body.getAttribute('theme-mode');
  if (themeMode === 'dark') return 'dark';
  if (themeMode === 'light') return 'light';
  
  // Check saved preference
  const saved = localStorage.getItem('a2ui-theme-mode');
  if (saved === 'dark' || saved === 'light' || saved === 'auto') {
    return saved as ThemeMode;
  }
  
  // Default to auto (system preference)
  return 'auto';
}

/**
 * Save theme mode preference to localStorage.
 */
export function saveThemeMode(mode: ThemeMode): void {
  localStorage.setItem('a2ui-theme-mode', mode);
}

/**
 * Subscribe to system theme changes (for 'auto' mode).
 * Returns an unsubscribe function.
 */
export function subscribeToSystemTheme(callback: (isDark: boolean) => void): () => void {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches);
  };
  
  mediaQuery.addEventListener('change', handler);
  
  return () => {
    mediaQuery.removeEventListener('change', handler);
  };
}

