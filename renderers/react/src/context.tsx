/**
 * A2UI Context, Provider, and Theming System
 */

import { createContext, useContext, useMemo, useCallback, type ReactNode, type CSSProperties } from 'react';
import type { A2UITheme, A2UIAction, A2UIContextValue, A2UIValue, PathReference, A2UIComponentSpec } from './types';

// =============================================================================
// COLOR PALETTES
// =============================================================================

const lightColors = {
  primary: '#1976d2',
  secondary: '#9c27b0',
  background: '#ffffff',
  surface: '#f5f5f5',
  text: '#212121',
  textSecondary: '#757575',
  error: '#d32f2f',
  success: '#388e3c',
  warning: '#f57c00',
};

const darkColors = {
  primary: '#90caf9',
  secondary: '#ce93d8',
  background: '#121212',
  surface: '#1e1e1e',
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  error: '#f44336',
  success: '#66bb6a',
  warning: '#ffa726',
};

// =============================================================================
// DEFAULT THEMES
// =============================================================================

const baseTypography = {
  h1: { fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.2 },
  h2: { fontSize: '2rem', fontWeight: 600, lineHeight: 1.3 },
  h3: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.4 },
  h4: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
  h5: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 },
  body: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.5 },
  caption: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.4 },
};

export const lightTheme: A2UITheme = {
  mode: 'light',
  colors: lightColors,
  typography: baseTypography,
  spacing: (factor: number) => factor * 8,
  borderRadius: 8,
  font: 'system-ui, -apple-system, sans-serif',
};

export const darkTheme: A2UITheme = {
  mode: 'dark',
  colors: darkColors,
  typography: baseTypography,
  spacing: (factor: number) => factor * 8,
  borderRadius: 8,
  font: 'system-ui, -apple-system, sans-serif',
};

// Default export (light theme for backwards compatibility)
export const defaultTheme = lightTheme;

// =============================================================================
// CSS CUSTOM PROPERTIES
// =============================================================================

export function themeToCSSVars(theme: A2UITheme): CSSProperties {
  return {
    '--a2ui-primary': theme.colors.primary,
    '--a2ui-secondary': theme.colors.secondary,
    '--a2ui-background': theme.colors.background,
    '--a2ui-surface': theme.colors.surface,
    '--a2ui-text': theme.colors.text,
    '--a2ui-text-secondary': theme.colors.textSecondary,
    '--a2ui-error': theme.colors.error,
    '--a2ui-success': theme.colors.success,
    '--a2ui-warning': theme.colors.warning,
    '--a2ui-border-radius': `${theme.borderRadius}px`,
    '--a2ui-font': theme.font || 'system-ui, sans-serif',
  } as CSSProperties;
}

// =============================================================================
// THEME FROM SPEC
// =============================================================================

/**
 * Applies Theme component properties to the base theme
 * A2UI Theme spec: { component: 'Theme', primaryColor: '#hex', font: 'string' }
 */
export function applyThemeSpec(baseTheme: A2UITheme, themeSpec?: { primaryColor?: string; font?: string }): A2UITheme {
  if (!themeSpec) return baseTheme;

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: themeSpec.primaryColor || baseTheme.colors.primary,
    },
    font: themeSpec.font || baseTheme.font,
  };
}

// =============================================================================
// CONTEXT
// =============================================================================

const A2UIContext = createContext<A2UIContextValue | null>(null);

export function useA2UI(): A2UIContextValue {
  const ctx = useContext(A2UIContext);
  if (!ctx) throw new Error('useA2UI must be used within A2UIProvider');
  return ctx;
}

// =============================================================================
// PATH RESOLUTION
// =============================================================================

function isPathRef(value: unknown): value is PathReference {
  return typeof value === 'object' && value !== null && 'path' in value;
}

function getByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

export function resolvePath<T>(value: A2UIValue<T>, data: Record<string, unknown>): T {
  if (isPathRef(value)) return getByPath(data, value.path) as T;
  return value;
}

export function useResolve<T>(value: A2UIValue<T>): T {
  const { data } = useA2UI();
  return resolvePath(value, data);
}

// =============================================================================
// PROVIDER
// =============================================================================

interface A2UIProviderProps {
  children: ReactNode;
  data?: Record<string, unknown>;
  theme?: Partial<A2UITheme>;
  mode?: 'light' | 'dark' | 'system';
  onAction?: (action: A2UIAction) => void;
}

export function A2UIProvider({ children, data = {}, theme: themeOverrides, mode = 'light', onAction }: A2UIProviderProps) {
  // Resolve 'system' to actual light/dark based on media query
  const resolvedMode: 'light' | 'dark' = useMemo(() => {
    if (mode === 'system') {
      return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return mode;
  }, [mode]);

  const baseTheme = resolvedMode === 'dark' ? darkTheme : lightTheme;

  const theme = useMemo<A2UITheme>(
    () => ({
      ...baseTheme,
      ...themeOverrides,
      colors: { ...baseTheme.colors, ...themeOverrides?.colors },
      typography: { ...baseTheme.typography, ...themeOverrides?.typography },
      mode: themeOverrides?.mode || resolvedMode,
    }),
    [baseTheme, themeOverrides, resolvedMode]
  );

  const dispatch = useCallback(
    (action: A2UIAction) => {
      onAction?.(action);
    },
    [onAction]
  );

  const value = useMemo(() => ({ data, theme, dispatch }), [data, theme, dispatch]);

  return <A2UIContext.Provider value={value}>{children}</A2UIContext.Provider>;
}

// =============================================================================
// TEMPLATE INSTANTIATION
// =============================================================================

export function instantiateTemplate(template: A2UIComponentSpec, item: unknown, index: number): A2UIComponentSpec {
  const json = JSON.stringify(template);
  const replaced = json.replace(/\{"path":"item\.([^"]+)"\}/g, (_, path: string) => {
    const value = path.split('.').reduce((acc: unknown, key: string) => {
      if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
      return undefined;
    }, item);
    return JSON.stringify(value);
  });
  const withIndex = replaced.replace(/\{"path":"index"\}/g, JSON.stringify(index));
  return JSON.parse(withIndex);
}
