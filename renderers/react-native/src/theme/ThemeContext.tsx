/**
 * A2UI Theme Context
 *
 * Provides theming capabilities for A2UI components.
 * Follows React Native styling patterns.
 */

import React, { createContext, useContext, useMemo } from 'react';
import type { TextStyle, ViewStyle } from 'react-native';

// Color palette interface
export interface ColorPalette {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
    inverse: string;
  };
  border: string;
  divider: string;
}

// Typography interface
export interface Typography {
  h1: TextStyle;
  h2: TextStyle;
  h3: TextStyle;
  body: TextStyle;
  bodySmall: TextStyle;
  button: TextStyle;
  caption: TextStyle;
  label: TextStyle;
}

// Spacing scale
export interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

// Border radius scale
export interface BorderRadius {
  none: number;
  sm: number;
  md: number;
  lg: number;
  full: number;
}

// Component-specific styles
export interface ComponentStyles {
  Button: {
    container: ViewStyle;
    primary: ViewStyle;
    secondary: ViewStyle;
    outline: ViewStyle;
    text: ViewStyle;
    disabled: ViewStyle;
    label: TextStyle;
  };
  Card: {
    container: ViewStyle;
  };
  TextField: {
    container: ViewStyle;
    input: TextStyle & ViewStyle;
    label: TextStyle;
    error: TextStyle;
    focused: ViewStyle;
  };
  Checkbox: {
    container: ViewStyle;
    box: ViewStyle;
    checked: ViewStyle;
    label: TextStyle;
  };
  Slider: {
    track: ViewStyle;
    fill: ViewStyle;
    thumb: ViewStyle;
  };
  Modal: {
    overlay: ViewStyle;
    content: ViewStyle;
  };
  Tabs: {
    container: ViewStyle;
    tab: ViewStyle;
    tabActive: ViewStyle;
    tabLabel: TextStyle;
    tabLabelActive: TextStyle;
  };
}

// Complete theme interface
export interface A2UITheme {
  colors: ColorPalette;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  components: ComponentStyles;
  isDark: boolean;
}

// Default light theme
export const lightTheme: A2UITheme = {
  isDark: false,
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    info: '#5AC8FA',
    text: {
      primary: '#000000',
      secondary: '#666666',
      disabled: '#999999',
      inverse: '#FFFFFF',
    },
    border: '#E0E0E0',
    divider: '#E0E0E0',
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
    },
    button: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 18,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 16,
    full: 9999,
  },
  components: {
    Button: {
      container: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
      },
      primary: {
        backgroundColor: '#007AFF',
      },
      secondary: {
        backgroundColor: '#5856D6',
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#007AFF',
      },
      text: {
        backgroundColor: 'transparent',
      },
      disabled: {
        backgroundColor: '#E0E0E0',
      },
      label: {
        fontSize: 16,
        fontWeight: '600',
      },
    },
    Card: {
      container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    },
    TextField: {
      container: {
        marginVertical: 8,
      },
      input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        backgroundColor: '#FFFFFF',
      },
      label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
        color: '#333333',
      },
      error: {
        fontSize: 12,
        color: '#FF3B30',
        marginTop: 4,
      },
      focused: {
        borderColor: '#007AFF',
        borderWidth: 2,
      },
    },
    Checkbox: {
      container: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      box: {
        width: 22,
        height: 22,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
      },
      checked: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
      },
      label: {
        marginLeft: 8,
        fontSize: 16,
      },
    },
    Slider: {
      track: {
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
      },
      fill: {
        backgroundColor: '#007AFF',
      },
      thumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
      },
    },
    Modal: {
      overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
      },
      content: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        maxWidth: '90%',
        maxHeight: '80%',
      },
    },
    Tabs: {
      container: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
      },
      tab: {
        paddingVertical: 12,
        paddingHorizontal: 16,
      },
      tabActive: {
        borderBottomWidth: 2,
        borderBottomColor: '#007AFF',
      },
      tabLabel: {
        fontSize: 14,
        color: '#666666',
      },
      tabLabelActive: {
        color: '#007AFF',
        fontWeight: '600',
      },
    },
  },
};

// Default dark theme
export const darkTheme: A2UITheme = {
  isDark: true,
  colors: {
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    background: '#000000',
    surface: '#1C1C1E',
    error: '#FF453A',
    success: '#30D158',
    warning: '#FF9F0A',
    info: '#64D2FF',
    text: {
      primary: '#FFFFFF',
      secondary: '#EBEBF5',
      disabled: '#636366',
      inverse: '#000000',
    },
    border: '#38383A',
    divider: '#38383A',
  },
  typography: lightTheme.typography, // Same typography
  spacing: lightTheme.spacing, // Same spacing
  borderRadius: lightTheme.borderRadius, // Same border radius
  components: {
    Button: {
      ...lightTheme.components.Button,
      primary: {
        backgroundColor: '#0A84FF',
      },
      secondary: {
        backgroundColor: '#5E5CE6',
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#0A84FF',
      },
      disabled: {
        backgroundColor: '#38383A',
      },
    },
    Card: {
      container: {
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
      },
    },
    TextField: {
      container: {
        marginVertical: 8,
      },
      input: {
        borderWidth: 1,
        borderColor: '#38383A',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        backgroundColor: '#1C1C1E',
        color: '#FFFFFF',
      },
      label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
        color: '#EBEBF5',
      },
      error: {
        fontSize: 12,
        color: '#FF453A',
        marginTop: 4,
      },
      focused: {
        borderColor: '#0A84FF',
        borderWidth: 2,
      },
    },
    Checkbox: {
      container: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      box: {
        width: 22,
        height: 22,
        borderWidth: 2,
        borderColor: '#38383A',
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
      },
      checked: {
        backgroundColor: '#0A84FF',
        borderColor: '#0A84FF',
      },
      label: {
        marginLeft: 8,
        fontSize: 16,
        color: '#FFFFFF',
      },
    },
    Slider: {
      track: {
        height: 4,
        backgroundColor: '#38383A',
        borderRadius: 2,
      },
      fill: {
        backgroundColor: '#0A84FF',
      },
      thumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
      },
    },
    Modal: {
      overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
      },
      content: {
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 20,
        maxWidth: '90%',
        maxHeight: '80%',
      },
    },
    Tabs: {
      container: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#38383A',
      },
      tab: {
        paddingVertical: 12,
        paddingHorizontal: 16,
      },
      tabActive: {
        borderBottomWidth: 2,
        borderBottomColor: '#0A84FF',
      },
      tabLabel: {
        fontSize: 14,
        color: '#EBEBF5',
      },
      tabLabelActive: {
        color: '#0A84FF',
        fontWeight: '600',
      },
    },
  },
};

// Theme context
const ThemeContext = createContext<A2UITheme>(lightTheme);

// Theme provider props
interface A2UIThemeProviderProps {
  theme?: A2UITheme | 'light' | 'dark';
  children: React.ReactNode;
}

// Theme provider component
export const A2UIThemeProvider: React.FC<A2UIThemeProviderProps> = ({
  theme = 'light',
  children,
}) => {
  const resolvedTheme = useMemo(() => {
    if (typeof theme === 'string') {
      return theme === 'dark' ? darkTheme : lightTheme;
    }
    return theme;
  }, [theme]);

  return (
    <ThemeContext.Provider value={resolvedTheme}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme
export const useA2UITheme = (): A2UITheme => {
  return useContext(ThemeContext);
};

// Utility to create custom themes
export const createTheme = (
  overrides: Partial<A2UITheme>,
  baseTheme: A2UITheme = lightTheme
): A2UITheme => {
  return {
    ...baseTheme,
    ...overrides,
    colors: {
      ...baseTheme.colors,
      ...overrides.colors,
      text: {
        ...baseTheme.colors.text,
        ...overrides.colors?.text,
      },
    },
    typography: {
      ...baseTheme.typography,
      ...overrides.typography,
    },
    spacing: {
      ...baseTheme.spacing,
      ...overrides.spacing,
    },
    borderRadius: {
      ...baseTheme.borderRadius,
      ...overrides.borderRadius,
    },
    components: {
      ...baseTheme.components,
      ...overrides.components,
    },
  };
};

export default ThemeContext;
