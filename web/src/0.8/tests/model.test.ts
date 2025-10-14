/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "node:assert";
import { describe, it, beforeEach } from "node:test";
import { A2UIModelProcessor } from "../data/model-processor.js";

// Helper function to strip reactivity for clean comparisons.
const toPlainObject = (obj: unknown) => JSON.parse(JSON.stringify(obj));

describe("A2UIModelProcessor", () => {
  let processor: A2UIModelProcessor;

  beforeEach(() => {
    processor = new A2UIModelProcessor();
  });

  describe("Basic Initialization and State", () => {
    it("should start with no surfaces and no styles", () => {
      assert.strictEqual(processor.getSurfaces().size, 0);
      assert.deepStrictEqual(processor.getStyles(), {});
    });

    it("should clear surfaces when clearSurfaces is called", () => {
      processor.processMessages([{ beginRendering: { root: "root" } }]);
      assert.strictEqual(processor.getSurfaces().size, 1);
      processor.clearSurfaces();
      assert.strictEqual(processor.getSurfaces().size, 0);
    });
  });

  describe("Message Processing", () => {
    it("should handle `beginRendering` by creating a default surface", () => {
      processor.processMessages([
        {
          beginRendering: {
            root: "comp-a",
            styles: { color: "blue" },
          },
        },
      ]);
      const surfaces = processor.getSurfaces();
      assert.strictEqual(surfaces.size, 1);

      const defaultSurface = surfaces.get("@default");
      assert.ok(defaultSurface, "Default surface should exist");
      assert.strictEqual(defaultSurface.rootComponentId, "comp-a");
      assert.deepStrictEqual(processor.getStyles(), { color: "blue" });
    });

    it("should handle `surfaceUpdate` by adding components", () => {
      const messages = [
        {
          surfaceUpdate: {
            components: [
              {
                id: "comp-a",
                componentProperties: {
                  Text: { text: { literalString: "Hi" } },
                },
              },
            ],
          },
        },
      ];
      processor.processMessages(messages);
      const surface = processor.getSurfaces().get("@default");
      if (!surface) {
        assert.fail("No default surface");
      }
      assert.strictEqual(surface.components.size, 1);
      assert.ok(surface.components.has("comp-a"));
    });

    it("should handle `deleteSurface`", () => {
      processor.processMessages([
        { surfaceId: "to-delete", beginRendering: { root: "root" } },
        { deleteSurface: { surfaceId: "to-delete" } },
      ]);
      assert.strictEqual(processor.getSurfaces().has("to-delete"), false);
    });
  });

  describe("Data Model Updates", () => {
    it("should update data at a specified path", () => {
      processor.processMessages([
        {
          dataModelUpdate: {
            path: "/user/name",
            contents: "Alice",
          },
        },
      ]);
      const name = processor.getDataByPath("/user/name");
      assert.strictEqual(name, "Alice");
    });

    it("should replace the entire data model when path is not provided", () => {
      const initialData = { user: { name: "Bob" } };
      processor.processMessages([
        { dataModelUpdate: { contents: initialData } },
      ]);
      const user = processor.getDataByPath("/user");
      assert.deepStrictEqual(toPlainObject(user), { name: "Bob" });
    });

    it("should create nested structures when setting data", () => {
      processor.setDataByPath("/a/b/c", "value");
      const data = processor.getDataByPath("/a/b/c");
      assert.strictEqual(data, "value");
    });

    it("should handle paths correctly", () => {
      const path1 = processor.resolvePath("/a/b/c", "/value");
      const path2 = processor.resolvePath("a/b/c", "/value/");
      const path3 = processor.resolvePath("a/b/c", "/value");

      assert.strictEqual(path1, "/value/a/b/c");
      assert.strictEqual(path2, "/value/a/b/c");
      assert.strictEqual(path3, "/value/a/b/c");
    });
  });

  describe("Component Tree Building", () => {
    it("should build a simple parent-child tree", () => {
      processor.processMessages([
        {
          surfaceUpdate: {
            components: [
              {
                id: "root",
                componentProperties: {
                  Column: { children: { explicitList: ["child"] } },
                },
              },
              {
                id: "child",
                componentProperties: {
                  Text: { text: { literalString: "Hello" } },
                },
              },
            ],
          },
        },
        { beginRendering: { root: "root" } },
      ]);

      const tree = processor.getSurfaces().get("@default")?.componentTree;
      const plainTree = toPlainObject(tree);

      assert.strictEqual(plainTree.id, "root");
      assert.strictEqual(plainTree.type, "Column");
      assert.strictEqual(plainTree.properties.children.length, 1);
      assert.strictEqual(plainTree.properties.children[0].id, "child");
      assert.strictEqual(plainTree.properties.children[0].type, "Text");
    });

    it("should throw an error on circular dependencies", () => {
      assert.throws(() => {
        processor.processMessages([
          {
            surfaceUpdate: {
              components: [
                { id: "a", componentProperties: { Card: { child: "b" } } },
                { id: "b", componentProperties: { Card: { child: "a" } } },
              ],
            },
          },
        ]);

        processor.processMessages([{ beginRendering: { root: "a" } }]);
      }, new Error(`Circular dependency for component "a".`));
      const tree = processor.getSurfaces().get("@default")?.componentTree;
      assert.strictEqual(
        tree,
        null,
        "Tree should be null due to circular dependency"
      );
    });

    it("should correctly expand a template with `dataBinding`", () => {
      processor.processMessages([
        {
          dataModelUpdate: {
            path: "/items",
            contents: [{ name: "A" }, { name: "B" }],
          },
        },
        {
          surfaceUpdate: {
            components: [
              {
                id: "root",
                componentProperties: {
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
                componentProperties: { Text: { text: { path: "/name" } } },
              },
            ],
          },
        },
        { beginRendering: { root: "root" } },
      ]);

      const tree = processor.getSurfaces().get("@default")?.componentTree;
      const plainTree = toPlainObject(tree);

      assert.strictEqual(plainTree.properties.children.length, 2);

      // Check first generated child.
      const child1 = plainTree.properties.children[0];
      assert.strictEqual(child1.id, "item-template:0");
      assert.strictEqual(child1.type, "Text");
      assert.strictEqual(child1.dataContextPath, "/items/0");

      // Check second generated child.
      const child2 = plainTree.properties.children[1];
      assert.strictEqual(child2.id, "item-template:1");
      assert.strictEqual(child2.type, "Text");
      assert.strictEqual(child2.dataContextPath, "/items/1");
    });

    it("should rebuild the tree when data for a template arrives later", () => {
      processor.processMessages([
        {
          surfaceUpdate: {
            components: [
              {
                id: "root",
                componentProperties: {
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
                componentProperties: { Text: { text: { path: "/name" } } },
              },
            ],
          },
        },
        { beginRendering: { root: "root" } },
      ]);

      let tree = processor.getSurfaces().get("@default")?.componentTree;
      assert.strictEqual(
        toPlainObject(tree).properties.children.length,
        0,
        "Children should be empty before data arrives"
      );

      // Now, the data arrives.
      processor.processMessages([
        {
          dataModelUpdate: {
            path: "/items",
            contents: [{ name: "A" }, { name: "B" }],
          },
        },
      ]);

      tree = processor.getSurfaces().get("@default")?.componentTree;
      assert.strictEqual(
        toPlainObject(tree).properties.children.length,
        2,
        "Children should be populated after data arrives"
      );
    });

    it("should trim relative paths within a data context", () => {
      processor.processMessages([
        {
          dataModelUpdate: {
            path: "/items",
            contents: [{ name: "A" }, { name: "B" }],
          },
        },
        {
          surfaceUpdate: {
            components: [
              {
                id: "root",
                componentProperties: {
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
              // These paths would are typical when a databinding is used.
              {
                id: "item-template",
                componentProperties: { Text: { text: { path: "/item/name" } } },
              },
              {
                id: "item-template-alt",
                componentProperties: { Text: { text: { path: "./name" } } },
              },
            ],
          },
        },
        { beginRendering: { root: "root" } },
      ]);

      const tree = processor.getSurfaces().get("@default")?.componentTree;
      const plainTree = toPlainObject(tree);
      const child = plainTree.properties.children[0];

      // The processor should have trimmed `/item` and `./` from the path
      // because we are inside a data context.
      assert.deepStrictEqual(child.properties.text, { path: "/name" });
    });
  });
});
