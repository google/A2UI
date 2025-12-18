import { createContext, useContext, ReactNode, useMemo } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextValue {
  mode: ThemeMode;
}

const ThemeContext = createContext<ThemeContextValue>({ mode: 'light' });

export interface ThemeProviderProps {
  mode?: ThemeMode;
  children: ReactNode;
}

/**
 * Theme provider for A2UI React renderer.
 * Provides theme mode context for components.
 */
export function ThemeProvider({ mode = 'light', children }: ThemeProviderProps) {
  const value = useMemo(() => ({ mode }), [mode]);
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access the current theme mode.
 */
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

