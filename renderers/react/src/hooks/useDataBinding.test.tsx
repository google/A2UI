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
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { A2UIProvider } from "../context/A2UIContext.js";
import { useA2UIContext } from "../context/A2UIContext.js";
import { useDataBinding } from "./useDataBinding.js";
import { Types } from "@a2ui/lit/0.8";

// Helper to create a mock node
function createMockNode(dataContextPath: string = "/"): Types.AnyComponentNode {
  return {
    id: "test-node",
    type: "Text",
    dataContextPath,
    properties: {},
  } as Types.AnyComponentNode;
}

// Wrapper component for testing hooks
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <A2UIProvider>{children}</A2UIProvider>
);

describe("useDataBinding", () => {
  describe("resolveString", () => {
    it("should return null for undefined value", () => {
      const { result } = renderHook(
        () => useDataBinding(createMockNode(), "@default"),
        { wrapper }
      );

      expect(result.current.resolveString(undefined)).toBeNull();
      expect(result.current.resolveString(null)).toBeNull();
    });

    it("should resolve literal string", () => {
      const { result } = renderHook(
        () => useDataBinding(createMockNode(), "@default"),
        { wrapper }
      );

      const value = result.current.resolveString({
        literalString: "Hello World",
      });
      expect(value).toBe("Hello World");
    });

    it("should resolve path-based string from data model", () => {
      const { result } = renderHook(
        () => {
          const context = useA2UIContext();
          const binding = useDataBinding(createMockNode(), "@default");
          return { context, binding };
        },
        { wrapper }
      );

      // Set up data in the model
      act(() => {
        result.current.context.processMessages([
          {
            dataModelUpdate: {
              surfaceId: "@default",
              path: "/",
              contents: [{ key: "greeting", valueString: "Hello from data" }],
            },
          },
        ]);
      });

      const value = result.current.binding.resolveString({ path: "/greeting" });
      expect(value).toBe("Hello from data");
    });

    it("should prioritize literal over path when both present", () => {
      const { result } = renderHook(
        () => {
          const context = useA2UIContext();
          const binding = useDataBinding(createMockNode(), "@default");
          return { context, binding };
        },
        { wrapper }
      );

      act(() => {
        result.current.context.processMessages([
          {
            dataModelUpdate: {
              surfaceId: "@default",
              path: "/",
              contents: [{ key: "name", valueString: "Data Name" }],
            },
          },
        ]);
      });

      const value = result.current.binding.resolveString({
        literalString: "Literal Name",
        path: "/name",
      });
      expect(value).toBe("Literal Name");
    });
  });

  describe("resolveNumber", () => {
    it("should return null for undefined value", () => {
      const { result } = renderHook(
        () => useDataBinding(createMockNode(), "@default"),
        { wrapper }
      );

      expect(result.current.resolveNumber(undefined)).toBeNull();
      expect(result.current.resolveNumber(null)).toBeNull();
    });

    it("should resolve literal number", () => {
      const { result } = renderHook(
        () => useDataBinding(createMockNode(), "@default"),
        { wrapper }
      );

      const value = result.current.resolveNumber({ literalNumber: 42 });
      expect(value).toBe(42);
    });

    it("should resolve path-based number from data model", () => {
      const { result } = renderHook(
        () => {
          const context = useA2UIContext();
          const binding = useDataBinding(createMockNode(), "@default");
          return { context, binding };
        },
        { wrapper }
      );

      act(() => {
        result.current.context.processMessages([
          {
            dataModelUpdate: {
              surfaceId: "@default",
              path: "/",
              contents: [{ key: "count", valueString: "100" }],
            },
          },
        ]);
      });

      const value = result.current.binding.resolveNumber({ path: "/count" });
      expect(value).toBe(100);
    });
  });

  describe("resolveBoolean", () => {
    it("should return null for undefined value", () => {
      const { result } = renderHook(
        () => useDataBinding(createMockNode(), "@default"),
        { wrapper }
      );

      expect(result.current.resolveBoolean(undefined)).toBeNull();
      expect(result.current.resolveBoolean(null)).toBeNull();
    });

    it("should resolve literal boolean true", () => {
      const { result } = renderHook(
        () => useDataBinding(createMockNode(), "@default"),
        { wrapper }
      );

      expect(result.current.resolveBoolean({ literalBoolean: true })).toBe(true);
    });

    it("should resolve literal boolean false", () => {
      const { result } = renderHook(
        () => useDataBinding(createMockNode(), "@default"),
        { wrapper }
      );

      expect(result.current.resolveBoolean({ literalBoolean: false })).toBe(false);
    });

    it("should resolve path-based boolean from data model", () => {
      const { result } = renderHook(
        () => {
          const context = useA2UIContext();
          const binding = useDataBinding(createMockNode(), "@default");
          return { context, binding };
        },
        { wrapper }
      );

      act(() => {
        result.current.context.processMessages([
          {
            dataModelUpdate: {
              surfaceId: "@default",
              path: "/",
              contents: [{ key: "enabled", valueString: "true" }],
            },
          },
        ]);
      });

      const value = result.current.binding.resolveBoolean({ path: "/enabled" });
      expect(value).toBe(true);
    });
  });

  describe("setValue and getValue", () => {
    it("should set and get values in data model", () => {
      const { result } = renderHook(
        () => {
          const context = useA2UIContext();
          const binding = useDataBinding(createMockNode(), "@default");
          return { context, binding };
        },
        { wrapper }
      );

      act(() => {
        result.current.binding.setValue("/test/value", "test-value");
      });

      const value = result.current.binding.getValue("/test/value");
      expect(value).toBe("test-value");
    });

    it("should handle nested paths", () => {
      const { result } = renderHook(
        () => {
          const context = useA2UIContext();
          const binding = useDataBinding(createMockNode(), "@default");
          return { context, binding };
        },
        { wrapper }
      );

      act(() => {
        result.current.binding.setValue("/deep/nested/path", "deep-value");
      });

      const value = result.current.binding.getValue("/deep/nested/path");
      expect(value).toBe("deep-value");
    });
  });

  describe("Data Context Path", () => {
    it("should respect node data context path for relative paths", () => {
      const { result } = renderHook(
        () => {
          const context = useA2UIContext();
          const node = createMockNode("/items/0");
          const binding = useDataBinding(node, "@default");
          return { context, binding, node };
        },
        { wrapper }
      );

      act(() => {
        result.current.context.processMessages([
          {
            dataModelUpdate: {
              surfaceId: "@default",
              path: "/",
              contents: [
                {
                  key: "items",
                  valueString: JSON.stringify([
                    { name: "First Item" },
                    { name: "Second Item" },
                  ]),
                },
              ],
            },
          },
        ]);
      });

      // The relative path "name" should resolve within the context "/items/0"
      const value = result.current.binding.resolveString({ path: "name" });
      expect(value).toBe("First Item");
    });
  });
});
