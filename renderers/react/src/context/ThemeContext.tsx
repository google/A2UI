/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import React, { createContext, useContext, type ReactNode } from "react";
import { Types } from "@a2ui/lit/0.8";

const ThemeContext = createContext<Types.Theme | null>(null);

/**
 * Default theme with Tailwind CSS classes for ShadCN-style components.
 */
export const defaultTheme: Types.Theme = {
  components: {
    AudioPlayer: {},
    Button: {
      "inline-flex": true,
      "items-center": true,
      "justify-center": true,
      "whitespace-nowrap": true,
      "rounded-md": true,
      "text-sm": true,
      "font-medium": true,
      "transition-colors": true,
      "focus-visible:outline-none": true,
      "focus-visible:ring-2": true,
      "focus-visible:ring-indigo-500": true,
      "focus-visible:ring-offset-2": true,
      "disabled:pointer-events-none": true,
      "disabled:opacity-50": true,
      "bg-indigo-500": true,
      "text-white": true,
      "hover:bg-indigo-600": true,
      "h-9": true,
      "px-4": true,
      "py-2": true,
      "gap-2": true,
    },
    Card: {
      "rounded-lg": true,
      border: true,
      "bg-card": true,
      "text-card-foreground": true,
      "shadow-sm": true,
      "p-4": true,
    },
    Column: {
      flex: true,
      "flex-col": true,
      "gap-1": true,
    },
    CheckBox: {
      container: { flex: true, "items-center": true, "space-x-2": true },
      element: {
        "h-4": true,
        "w-4": true,
        "rounded-sm": true,
        border: true,
        "border-primary": true,
        "ring-offset-background": true,
        "focus-visible:outline-none": true,
        "focus-visible:ring-2": true,
        "focus-visible:ring-ring": true,
        "focus-visible:ring-offset-2": true,
        "disabled:cursor-not-allowed": true,
        "disabled:opacity-50": true,
      },
      label: { "text-sm": true, "font-medium": true, "leading-none": true },
    },
    DateTimeInput: {
      container: { "grid": true, "gap-2": true },
      element: {
        flex: true,
        "h-10": true,
        "w-full": true,
        "rounded-md": true,
        border: true,
        "border-input": true,
        "bg-background": true,
        "px-3": true,
        "py-2": true,
        "text-sm": true,
        "ring-offset-background": true,
        "focus-visible:outline-none": true,
        "focus-visible:ring-2": true,
        "focus-visible:ring-ring": true,
        "focus-visible:ring-offset-2": true,
      },
      label: { "text-sm": true, "font-medium": true },
    },
    Divider: {
      "shrink-0": true,
      "bg-border": true,
    },
    Image: {
      all: { "max-w-full": true, "h-auto": true },
      icon: { "w-5": true, "h-5": true },
      avatar: { "w-24": true, "h-24": true, "rounded-full": true, "object-cover": true, "mx-auto": true },
      smallFeature: { "w-24": true, "h-auto": true, "rounded-md": true },
      mediumFeature: { "w-48": true, "h-auto": true, "rounded-md": true },
      largeFeature: { "w-96": true, "h-auto": true, "rounded-md": true },
      header: { "w-full": true, "h-auto": true, "rounded-md": true },
    },
    Icon: {
      container: {
        flex: true,
        "items-center": true,
        "justify-center": true,
        "w-10": true,
        "h-10": true,
        "rounded-lg": true,
        "bg-gray-100": true,
        "shrink-0": true,
      },
      element: {
        "w-5": true,
        "h-5": true,
        "text-gray-600": true,
      },
    } as unknown as Record<string, boolean>,
    List: {
      flex: true,
      "overflow-auto": true,
    },
    Modal: {
      backdrop: {
        fixed: true,
        inset: true,
        "z-50": true,
        "bg-black/80": true,
      },
      element: {
        fixed: true,
        "left-[50%]": true,
        "top-[50%]": true,
        "z-50": true,
        "w-full": true,
        "max-w-lg": true,
        "translate-x-[-50%]": true,
        "translate-y-[-50%]": true,
        "rounded-lg": true,
        border: true,
        "bg-background": true,
        "p-6": true,
        shadow: true,
      },
    },
    MultipleChoice: {
      container: { grid: true, "gap-2": true },
      element: {
        flex: true,
        "h-10": true,
        "w-full": true,
        "items-center": true,
        "justify-between": true,
        "rounded-md": true,
        border: true,
        "border-input": true,
        "bg-background": true,
        "px-3": true,
        "py-2": true,
        "text-sm": true,
        "ring-offset-background": true,
        "focus:outline-none": true,
        "focus:ring-2": true,
        "focus:ring-ring": true,
        "focus:ring-offset-2": true,
      },
      label: { "text-sm": true, "font-medium": true },
    },
    Row: {
      flex: true,
      "flex-row": true,
      "gap-2": true,
    },
    Slider: {
      container: { grid: true, "gap-2": true },
      element: {
        "w-full": true,
        "cursor-pointer": true,
      },
      label: { "text-sm": true, "font-medium": true },
    },
    Tabs: {
      container: {},
      element: {},
      controls: {
        all: {
          "inline-flex": true,
          "h-10": true,
          "items-center": true,
          "justify-center": true,
          "rounded-md": true,
          "bg-muted": true,
          "p-1": true,
          "text-muted-foreground": true,
        },
        selected: {
          "bg-background": true,
          "text-foreground": true,
          shadow: true,
        },
      },
    },
    Text: {
      all: { "leading-normal": true },
      h1: { "text-2xl": true, "font-semibold": true, "tracking-tight": true, "text-gray-800": true },
      h2: { "text-xl": true, "font-semibold": true, "tracking-tight": true, "text-gray-800": true },
      h3: { "text-lg": true, "font-semibold": true, "tracking-tight": true, "text-gray-800": true },
      h4: { "text-base": true, "font-medium": true, "text-gray-700": true },
      h5: { "text-sm": true, "font-medium": true, "text-gray-600": true },
      caption: { "text-xs": true, "text-gray-400": true },
      body: { "text-sm": true, "leading-normal": true, "text-gray-500": true },
    },
    TextField: {
      container: { grid: true, "gap-2": true },
      element: {
        flex: true,
        "h-10": true,
        "w-full": true,
        "rounded-md": true,
        border: true,
        "border-input": true,
        "bg-background": true,
        "px-3": true,
        "py-2": true,
        "text-sm": true,
        "ring-offset-background": true,
        "file:border-0": true,
        "file:bg-transparent": true,
        "file:text-sm": true,
        "file:font-medium": true,
        "placeholder:text-muted-foreground": true,
        "focus-visible:outline-none": true,
        "focus-visible:ring-2": true,
        "focus-visible:ring-ring": true,
        "focus-visible:ring-offset-2": true,
        "disabled:cursor-not-allowed": true,
        "disabled:opacity-50": true,
      },
      label: { "text-sm": true, "font-medium": true, "leading-none": true },
    },
    Video: {
      "w-full": true,
      "rounded-md": true,
    },
  },
  elements: {
    a: { "text-primary": true, underline: true, "underline-offset-4": true },
    audio: { "w-full": true },
    body: {},
    button: {},
    h1: { "text-4xl": true, "font-extrabold": true },
    h2: { "text-3xl": true, "font-semibold": true },
    h3: { "text-2xl": true, "font-semibold": true },
    h4: { "text-xl": true, "font-semibold": true },
    h5: { "text-lg": true, "font-semibold": true },
    iframe: { "w-full": true, border: true, "rounded-md": true },
    input: {},
    p: { "leading-7": true },
    pre: { "bg-muted": true, "p-4": true, "rounded-lg": true, "overflow-x-auto": true },
    textarea: {},
    video: { "w-full": true, "rounded-md": true },
  },
  markdown: {
    p: [],
    h1: [],
    h2: [],
    h3: [],
    h4: [],
    h5: [],
    ul: [],
    ol: [],
    li: [],
    a: [],
    strong: [],
    em: [],
  },
};

export interface ThemeProviderProps {
  children: ReactNode;
  theme?: Types.Theme;
}

/**
 * Theme Provider for A2UI components.
 * Provides CSS class mappings for all components.
 */
export function ThemeProvider({
  children,
  theme = defaultTheme,
}: ThemeProviderProps) {
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

/**
 * Hook to access the theme context.
 * Returns the default theme if no provider is found.
 */
export function useTheme(): Types.Theme {
  const context = useContext(ThemeContext);
  return context ?? defaultTheme;
}
