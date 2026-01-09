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

import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { A2UIProvider } from "../context/A2UIContext.js";
import { useA2UI } from "./useA2UI.js";
import type { A2UIActionEvent } from "../types/index.js";

// Wrapper component for testing hooks
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <A2UIProvider>{children}</A2UIProvider>
);

describe("useA2UI", () => {
  describe("Initial State", () => {
    it("should return all expected methods and properties", () => {
      const { result } = renderHook(() => useA2UI(), { wrapper });

      expect(result.current.surfaces).toBeDefined();
      expect(result.current.getSurface).toBeInstanceOf(Function);
      expect(result.current.processMessages).toBeInstanceOf(Function);
      expect(result.current.sendAction).toBeInstanceOf(Function);
      expect(result.current.getComponentTree).toBeInstanceOf(Function);
      expect(result.current.clearSurfaces).toBeInstanceOf(Function);
    });

    it("should start with empty surfaces", () => {
      const { result } = renderHook(() => useA2UI(), { wrapper });

      expect(result.current.surfaces.size).toBe(0);
    });
  });

  describe("getSurface", () => {
    it("should return undefined for non-existent surface", () => {
      const { result } = renderHook(() => useA2UI(), { wrapper });

      expect(result.current.getSurface("non-existent")).toBeUndefined();
    });

    it("should return surface after it is created", () => {
      const { result } = renderHook(() => useA2UI(), { wrapper });

      act(() => {
        result.current.processMessages([
          {
            beginRendering: {
              root: "root",
              surfaceId: "my-surface",
            },
          },
        ]);
      });

      const surface = result.current.getSurface("my-surface");
      expect(surface).toBeDefined();
      expect(surface!.rootComponentId).toBe("root");
    });
  });

  describe("getComponentTree", () => {
    it("should return null for non-existent surface", () => {
      const { result } = renderHook(() => useA2UI(), { wrapper });

      expect(result.current.getComponentTree("non-existent")).toBeNull();
    });

    it("should return component tree after rendering", () => {
      const { result } = renderHook(() => useA2UI(), { wrapper });

      act(() => {
        result.current.processMessages([
          {
            surfaceUpdate: {
              surfaceId: "@default",
              components: [
                {
                  id: "root",
                  component: {
                    Text: { text: { literalString: "Hello" } },
                  },
                },
              ],
            },
          },
          {
            beginRendering: {
              root: "root",
              surfaceId: "@default",
            },
          },
        ]);
      });

      const tree = result.current.getComponentTree("@default");
      expect(tree).toBeDefined();
      expect(tree!.id).toBe("root");
      expect(tree!.type).toBe("Text");
    });
  });

  describe("clearSurfaces", () => {
    it("should clear all surfaces", () => {
      const { result } = renderHook(() => useA2UI(), { wrapper });

      act(() => {
        result.current.processMessages([
          { beginRendering: { root: "root", surfaceId: "surface-1" } },
          { beginRendering: { root: "root", surfaceId: "surface-2" } },
        ]);
      });

      expect(result.current.surfaces.size).toBe(2);

      act(() => {
        result.current.clearSurfaces();
      });

      expect(result.current.surfaces.size).toBe(0);
    });
  });

  describe("sendAction", () => {
    it("should call onAction callback", () => {
      const onAction = vi.fn();
      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <A2UIProvider onAction={onAction}>{children}</A2UIProvider>
      );

      const { result } = renderHook(() => useA2UI(), { wrapper: customWrapper });

      const action: A2UIActionEvent = {
        type: "a2ui.action",
        actionId: "button-click",
        context: { buttonId: "submit" },
      };

      act(() => {
        result.current.sendAction(action);
      });

      expect(onAction).toHaveBeenCalledWith(action);
    });
  });

  describe("processMessages", () => {
    it("should handle complex component hierarchies", () => {
      const { result } = renderHook(() => useA2UI(), { wrapper });

      act(() => {
        result.current.processMessages([
          {
            surfaceUpdate: {
              surfaceId: "@default",
              components: [
                {
                  id: "root",
                  component: {
                    Column: { children: { explicitList: ["row-1", "row-2"] } },
                  },
                },
                {
                  id: "row-1",
                  component: {
                    Row: { children: { explicitList: ["text-1", "text-2"] } },
                  },
                },
                {
                  id: "row-2",
                  component: {
                    Row: { children: { explicitList: ["button-1"] } },
                  },
                },
                {
                  id: "text-1",
                  component: { Text: { text: { literalString: "Hello" } } },
                },
                {
                  id: "text-2",
                  component: { Text: { text: { literalString: "World" } } },
                },
                {
                  id: "button-1",
                  component: {
                    Button: {
                      child: "button-text",
                      action: { name: "click" },
                    },
                  },
                },
                {
                  id: "button-text",
                  component: { Text: { text: { literalString: "Click Me" } } },
                },
              ],
            },
          },
          {
            beginRendering: {
              root: "root",
              surfaceId: "@default",
            },
          },
        ]);
      });

      const tree = result.current.getComponentTree("@default");
      expect(tree).toBeDefined();
      expect(tree!.type).toBe("Column");

      // Access nested children through properties
      const properties = tree!.properties as { children?: any[] };
      expect(properties.children).toHaveLength(2);
      expect(properties.children![0].type).toBe("Row");
      expect(properties.children![1].type).toBe("Row");
    });

    it("should handle template expansion with data binding", () => {
      const { result } = renderHook(() => useA2UI(), { wrapper });

      act(() => {
        result.current.processMessages([
          {
            dataModelUpdate: {
              surfaceId: "@default",
              path: "/",
              contents: [
                {
                  key: "items",
                  valueString: JSON.stringify([
                    { name: "Item 1" },
                    { name: "Item 2" },
                    { name: "Item 3" },
                  ]),
                },
              ],
            },
          },
          {
            surfaceUpdate: {
              surfaceId: "@default",
              components: [
                {
                  id: "root",
                  component: {
                    List: {
                      children: {
                        template: {
                          componentId: "item-template",
                          dataBinding: "/items",
                        },
                      },
                    },
                  },
                },
                {
                  id: "item-template",
                  component: { Text: { text: { path: "/name" } } },
                },
              ],
            },
          },
          {
            beginRendering: {
              root: "root",
              surfaceId: "@default",
            },
          },
        ]);
      });

      const tree = result.current.getComponentTree("@default");
      expect(tree).toBeDefined();
      expect(tree!.type).toBe("List");

      const properties = tree!.properties as { children?: any[] };
      expect(properties.children).toHaveLength(3);
    });
  });
});
