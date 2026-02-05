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
import { A2UIProvider, useA2UIContext } from "./A2UIContext.js";
import type { A2UIActionEvent } from "../types/index.js";

// Wrapper component for testing hooks
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <A2UIProvider>{children}</A2UIProvider>
);

describe("A2UIContext", () => {
  describe("A2UIProvider", () => {
    it("should provide context to children", () => {
      const { result } = renderHook(() => useA2UIContext(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.processor).toBeDefined();
      expect(result.current.surfaces).toBeDefined();
      expect(result.current.processMessages).toBeInstanceOf(Function);
      expect(result.current.sendAction).toBeInstanceOf(Function);
    });

    it("should start with no surfaces", () => {
      const { result } = renderHook(() => useA2UIContext(), { wrapper });

      expect(result.current.surfaces.size).toBe(0);
    });

    it("should call onAction callback when sendAction is called", () => {
      const onAction = vi.fn();
      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <A2UIProvider onAction={onAction}>{children}</A2UIProvider>
      );

      const { result } = renderHook(() => useA2UIContext(), { wrapper: customWrapper });

      const action: A2UIActionEvent = {
        type: "a2ui.action",
        actionId: "test-action",
        context: { foo: "bar" },
      };

      act(() => {
        result.current.sendAction(action);
      });

      expect(onAction).toHaveBeenCalledWith(action);
    });
  });

  describe("useA2UIContext", () => {
    it("should throw error when used outside provider", () => {
      expect(() => {
        renderHook(() => useA2UIContext());
      }).toThrow("useA2UIContext must be used within an A2UIProvider");
    });
  });

  describe("Message Processing", () => {
    it("should handle beginRendering by creating a surface", () => {
      const { result } = renderHook(() => useA2UIContext(), { wrapper });

      act(() => {
        result.current.processMessages([
          {
            beginRendering: {
              root: "root-component",
              surfaceId: "@default",
            },
          },
        ]);
      });

      expect(result.current.surfaces.size).toBe(1);
      expect(result.current.surfaces.has("@default")).toBe(true);
    });

    it("should handle surfaceUpdate by adding components", () => {
      const { result } = renderHook(() => useA2UIContext(), { wrapper });

      act(() => {
        result.current.processMessages([
          {
            surfaceUpdate: {
              surfaceId: "@default",
              components: [
                {
                  id: "text-1",
                  component: {
                    Text: { text: { literalString: "Hello World" } },
                  },
                },
              ],
            },
          },
        ]);
      });

      const surface = result.current.surfaces.get("@default");
      expect(surface).toBeDefined();
      expect(surface!.components.size).toBe(1);
      expect(surface!.components.has("text-1")).toBe(true);
    });

    it("should handle deleteSurface", () => {
      const { result } = renderHook(() => useA2UIContext(), { wrapper });

      act(() => {
        result.current.processMessages([
          {
            beginRendering: { root: "root", surfaceId: "to-delete" },
          },
        ]);
      });

      expect(result.current.surfaces.has("to-delete")).toBe(true);

      act(() => {
        result.current.processMessages([
          { deleteSurface: { surfaceId: "to-delete" } },
        ]);
      });

      expect(result.current.surfaces.has("to-delete")).toBe(false);
    });

    it("should handle dataModelUpdate", () => {
      const { result } = renderHook(() => useA2UIContext(), { wrapper });

      act(() => {
        result.current.processMessages([
          {
            dataModelUpdate: {
              surfaceId: "@default",
              path: "/user",
              contents: [{ key: "name", valueString: "Alice" }],
            },
          },
        ]);
      });

      const mockNode = { dataContextPath: "/" } as any;
      const name = result.current.processor.getData(mockNode, "/user/name");
      expect(name).toBe("Alice");
    });

    it("should build component tree correctly", () => {
      const { result } = renderHook(() => useA2UIContext(), { wrapper });

      act(() => {
        result.current.processMessages([
          {
            surfaceUpdate: {
              surfaceId: "@default",
              components: [
                {
                  id: "root",
                  component: {
                    Column: { children: { explicitList: ["child"] } },
                  },
                },
                {
                  id: "child",
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

      const surface = result.current.surfaces.get("@default");
      expect(surface?.componentTree).toBeDefined();
      expect(surface?.componentTree?.id).toBe("root");
      expect(surface?.componentTree?.type).toBe("Column");
    });
  });

  describe("Multi-Surface Support", () => {
    it("should keep data and components separate for different surfaces", () => {
      const { result } = renderHook(() => useA2UIContext(), { wrapper });

      act(() => {
        result.current.processMessages([
          // Surface A
          {
            surfaceUpdate: {
              surfaceId: "A",
              components: [
                { id: "comp-a", component: { Text: { text: { literalString: "Surface A" } } } },
              ],
            },
          },
          { beginRendering: { root: "comp-a", surfaceId: "A" } },
          // Surface B
          {
            surfaceUpdate: {
              surfaceId: "B",
              components: [
                { id: "comp-b", component: { Text: { text: { literalString: "Surface B" } } } },
              ],
            },
          },
          { beginRendering: { root: "comp-b", surfaceId: "B" } },
        ]);
      });

      expect(result.current.surfaces.size).toBe(2);

      const surfaceA = result.current.surfaces.get("A");
      const surfaceB = result.current.surfaces.get("B");

      expect(surfaceA?.components.has("comp-a")).toBe(true);
      expect(surfaceA?.components.has("comp-b")).toBe(false);
      expect(surfaceB?.components.has("comp-b")).toBe(true);
      expect(surfaceB?.components.has("comp-a")).toBe(false);
    });
  });
});
