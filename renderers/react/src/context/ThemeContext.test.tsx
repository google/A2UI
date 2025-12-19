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

import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import React from "react";
import { ThemeProvider, useTheme, defaultTheme } from "./ThemeContext.js";
import type { Types } from "@a2ui/lit/0.8";

describe("ThemeContext", () => {
  describe("defaultTheme", () => {
    it("should have all required component themes", () => {
      expect(defaultTheme.components).toBeDefined();
      expect(defaultTheme.components.Text).toBeDefined();
      expect(defaultTheme.components.Button).toBeDefined();
      expect(defaultTheme.components.Card).toBeDefined();
      expect(defaultTheme.components.Row).toBeDefined();
      expect(defaultTheme.components.Column).toBeDefined();
      expect(defaultTheme.components.List).toBeDefined();
      expect(defaultTheme.components.Tabs).toBeDefined();
      expect(defaultTheme.components.Modal).toBeDefined();
      expect(defaultTheme.components.TextField).toBeDefined();
      expect(defaultTheme.components.CheckBox).toBeDefined();
      expect(defaultTheme.components.Slider).toBeDefined();
      expect(defaultTheme.components.Image).toBeDefined();
      expect(defaultTheme.components.Icon).toBeDefined();
      expect(defaultTheme.components.Video).toBeDefined();
      expect(defaultTheme.components.AudioPlayer).toBeDefined();
      expect(defaultTheme.components.Divider).toBeDefined();
      expect(defaultTheme.components.DateTimeInput).toBeDefined();
      expect(defaultTheme.components.MultipleChoice).toBeDefined();
    });

    it("should have element themes", () => {
      expect(defaultTheme.elements).toBeDefined();
      expect(defaultTheme.elements.a).toBeDefined();
      expect(defaultTheme.elements.button).toBeDefined();
      expect(defaultTheme.elements.input).toBeDefined();
    });

    it("should have markdown themes", () => {
      expect(defaultTheme.markdown).toBeDefined();
      expect(defaultTheme.markdown.p).toBeDefined();
      expect(defaultTheme.markdown.h1).toBeDefined();
      expect(defaultTheme.markdown.h2).toBeDefined();
      expect(defaultTheme.markdown.h3).toBeDefined();
      expect(defaultTheme.markdown.ul).toBeDefined();
      expect(defaultTheme.markdown.ol).toBeDefined();
      expect(defaultTheme.markdown.li).toBeDefined();
      expect(defaultTheme.markdown.a).toBeDefined();
      expect(defaultTheme.markdown.strong).toBeDefined();
      expect(defaultTheme.markdown.em).toBeDefined();
    });
  });

  describe("useTheme", () => {
    it("should return default theme when no provider", () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current).toBe(defaultTheme);
    });

    it("should return default theme when provider has no theme prop", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current).toBe(defaultTheme);
    });

    it("should return custom theme when provided", () => {
      const customTheme: Types.Theme = {
        components: {
          AudioPlayer: {},
          Button: { "custom-class": true },
          Card: {},
          Column: {},
          CheckBox: {},
          DateTimeInput: {},
          Divider: {},
          Image: {},
          Icon: {},
          List: {},
          Modal: {},
          MultipleChoice: {},
          Row: {},
          Slider: {},
          Tabs: {},
          Text: {},
          TextField: {},
          Video: {},
        },
        elements: {
          a: {},
          audio: {},
          body: {},
          button: {},
          h1: {},
          h2: {},
          h3: {},
          h4: {},
          h5: {},
          iframe: {},
          input: {},
          p: {},
          pre: {},
          textarea: {},
          video: {},
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

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider theme={customTheme}>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current).toBe(customTheme);
      expect(result.current.components.Button).toEqual({ "custom-class": true });
    });
  });

  describe("Theme CSS Classes", () => {
    it("should have Tailwind CSS classes for Button", () => {
      const buttonTheme = defaultTheme.components.Button;

      // Check for common ShadCN button styles
      expect(buttonTheme["inline-flex"]).toBe(true);
      expect(buttonTheme["items-center"]).toBe(true);
      expect(buttonTheme["justify-center"]).toBe(true);
      expect(buttonTheme["rounded-md"]).toBe(true);
    });

    it("should have Tailwind CSS classes for Card", () => {
      const cardTheme = defaultTheme.components.Card;

      expect(cardTheme["rounded-lg"]).toBe(true);
      expect(cardTheme["border"]).toBe(true);
      expect(cardTheme["shadow-sm"]).toBe(true);
    });

    it("should have flex classes for Row", () => {
      const rowTheme = defaultTheme.components.Row;

      expect(rowTheme["flex"]).toBe(true);
      expect(rowTheme["flex-row"]).toBe(true);
    });

    it("should have flex classes for Column", () => {
      const columnTheme = defaultTheme.components.Column;

      expect(columnTheme["flex"]).toBe(true);
      expect(columnTheme["flex-col"]).toBe(true);
    });

    it("should have Text variants for different usage hints", () => {
      const textTheme = defaultTheme.components.Text as Record<string, Record<string, boolean>>;

      expect(textTheme.h1).toBeDefined();
      expect(textTheme.h2).toBeDefined();
      expect(textTheme.h3).toBeDefined();
      expect(textTheme.caption).toBeDefined();
      expect(textTheme.body).toBeDefined();

      // Check h1 has large text styling
      expect(textTheme.h1["text-2xl"]).toBe(true);
      expect(textTheme.h1["font-semibold"]).toBe(true);
    });

    it("should have Image variants for different usage hints", () => {
      const imageTheme = defaultTheme.components.Image as Record<string, Record<string, boolean>>;

      expect(imageTheme.icon).toBeDefined();
      expect(imageTheme.avatar).toBeDefined();
      expect(imageTheme.smallFeature).toBeDefined();
      expect(imageTheme.mediumFeature).toBeDefined();
      expect(imageTheme.largeFeature).toBeDefined();
      expect(imageTheme.header).toBeDefined();

      // Check avatar has rounded-full
      expect(imageTheme.avatar["rounded-full"]).toBe(true);
    });
  });
});
