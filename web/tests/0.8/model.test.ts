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

import assert from "node:assert";
import { describe, it, beforeEach } from "node:test";
import { v0_8 } from "@a2ui/web-lib";

// Helper function to strip reactivity for clean comparisons.
const toPlainObject = (value: unknown): ReturnType<typeof JSON.parse> => {
  if (value instanceof Map) {
    return Object.fromEntries(
      Array.from(value.entries(), ([k, v]) => [k, toPlainObject(v)])
    );
  }
  if (Array.isArray(value)) {
    return value.map(toPlainObject);
  }
  if (
    v0_8.Data.Guards.isObject(value) &&
    value.constructor.name === "SignalObject"
  ) {
    const obj = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        obj[key] = toPlainObject(value[key]);
      }
    }
    return obj;
  }

  return value;
};

describe("A2UIModelProcessor", () => {
  let processor;

  beforeEach(() => {
    processor = new v0_8.Data.A2UIModelProcessor();
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
                component: {
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

      assert.strictEqual(path1, "/a/b/c");
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
                { id: "a", component: { Card: { child: "b" } } },
                { id: "b", component: { Card: { child: "a" } } },
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

    it("should trim relative paths within a data context (./item)", () => {
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
              // These paths would are typical when a databinding is used.
              {
                id: "item-template",
                component: { Text: { text: { path: "./item/name" } } },
              },
            ],
          },
        },
        { beginRendering: { root: "root" } },
      ]);

      const tree = processor.getSurfaces().get("@default")?.componentTree;
      const plainTree = toPlainObject(tree);
      const child1 = plainTree.properties.children[0];
      const child2 = plainTree.properties.children[1];

      // The processor should have trimmed `/item` and `./` from the path
      // because we are inside a data context.
      assert.deepEqual(child1.properties.text, { path: "name" });
      assert.deepEqual(child2.properties.text, { path: "name" });
    });

    it("should trim relative paths within a data context (./name)", () => {
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
              // These paths would are typical when a databinding is used.
              {
                id: "item-template",
                component: { Text: { text: { path: "./name" } } },
              },
            ],
          },
        },
        { beginRendering: { root: "root" } },
      ]);

      const tree = processor.getSurfaces().get("@default")?.componentTree;
      const plainTree = toPlainObject(tree);
      const child1 = plainTree.properties.children[0];
      const child2 = plainTree.properties.children[1];

      // The processor should have trimmed `/item` and `./` from the path
      // because we are inside a data context.
      assert.deepEqual(child1.properties.text, { path: "name" });
      assert.deepEqual(child2.properties.text, { path: "name" });
    });
  });

  describe("Data Normalization and Parsing", () => {
    it("should correctly handle and parse the key-value array data format at the root", () => {
      const messages = [
        {
          surfaceId: "test-surface",
          dataModelUpdate: {
            contents: [
              { key: "title", value_string: "My Title" },
              {
                key: "items",
                value_string: '[{"id": 1}, {"id": 2}]',
              },
            ],
          },
        },
      ];

      processor.processMessages(messages);

      const title = processor.getDataByPath("/title", "test-surface");
      const items = processor.getDataByPath("/items", "test-surface");

      assert.strictEqual(title, "My Title");
      assert.deepStrictEqual(toPlainObject(items), [{ id: 1 }, { id: 2 }]);
    });

    it("should fallback to a string if stringified JSON is invalid", () => {
      const invalidJSON = '[{"id": 1}, {"id": 2}'; // Missing closing bracket
      processor.processMessages([
        {
          dataModelUpdate: {
            contents: [{ key: "badData", value_string: invalidJSON }],
          },
        },
      ]);

      const badData = processor.getDataByPath("/badData");
      assert.strictEqual(badData, invalidJSON);
    });
  });

  describe("Complex Template Scenarios", () => {
    it("should correctly expand nested templates with layered data contexts", () => {
      const messages = [
        {
          dataModelUpdate: {
            path: "/days",
            contents: [
              {
                title: "Day 1",
                activities: ["Morning Walk", "Museum Visit"],
              },
              {
                title: "Day 2",
                activities: ["Market Trip"],
              },
            ],
          },
        },
        {
          surfaceUpdate: {
            components: [
              {
                id: "root",
                component: {
                  List: {
                    children: {
                      template: {
                        componentId: "day-list",
                        dataBinding: "/days",
                      },
                    },
                  },
                },
              },
              {
                id: "day-list",
                component: {
                  Column: {
                    children: { explicitList: ["day-title", "activity-list"] },
                  },
                },
              },
              {
                id: "day-title",
                component: { Heading: { text: { path: "title" } } },
              },
              {
                id: "activity-list",
                component: {
                  List: {
                    children: {
                      template: {
                        componentId: "activity-text",
                        dataBinding: "activities",
                      },
                    },
                  },
                },
              },
              {
                id: "activity-text",
                component: { Text: { text: { path: "." } } },
              },
            ],
          },
        },
        { beginRendering: { root: "root" } },
      ];

      processor.processMessages(messages);
      const tree = processor.getSurfaces().get("@default")?.componentTree;
      const plainTree = toPlainObject(tree);

      // Assert Day 1 structure
      const day1 = plainTree.properties.children[0];
      assert.strictEqual(day1.dataContextPath, "/days/0");
      const day1Activities = day1.properties.children[1].properties.children;
      assert.strictEqual(day1Activities.length, 2);
      assert.strictEqual(day1Activities[0].id, "activity-text:0:0");
      assert.strictEqual(
        day1Activities[0].dataContextPath,
        "/days/0/activities/0"
      );

      // Assert Day 2 structure
      const day2 = plainTree.properties.children[1];
      assert.strictEqual(day2.dataContextPath, "/days/1");
      const day2Activities = day2.properties.children[1].properties.children;
      assert.strictEqual(day2Activities.length, 1);
      assert.strictEqual(day2Activities[0].id, "activity-text:1:0");
      assert.strictEqual(
        day2Activities[0].dataContextPath,
        "/days/1/activities/0"
      );
    });

    it("should correctly bind to primitive values in an array using path: '.'", () => {
      processor.processMessages([
        {
          dataModelUpdate: {
            path: "/tags",
            contents: ["travel", "paris", "guide"],
          },
        },
        {
          surfaceUpdate: {
            components: [
              {
                id: "root",
                component: {
                  Row: {
                    children: {
                      template: { componentId: "tag", dataBinding: "/tags" },
                    },
                  },
                },
              },
              { id: "tag", component: { Text: { text: { path: "." } } } },
            ],
          },
        },
        { beginRendering: { root: "root" } },
      ]);

      const tree = processor.getSurfaces().get("@default")?.componentTree;
      const plainTree = toPlainObject(tree);
      const children = plainTree.properties.children;

      assert.strictEqual(children.length, 3);
      assert.strictEqual(children[0].dataContextPath, "/tags/0");
      assert.deepEqual(children[0].properties.text, { path: "." });
      assert.strictEqual(children[1].dataContextPath, "/tags/1");
      assert.deepEqual(children[1].properties.text, { path: "." });
    });
  });

  describe("Multi-Surface Interaction", () => {
    it("should keep data and components for different surfaces separate", () => {
      processor.processMessages([
        // Surface A
        {
          surfaceId: "A",
          dataModelUpdate: { contents: { name: "Surface A Data" } },
        },
        {
          surfaceId: "A",
          surfaceUpdate: {
            components: [
              {
                id: "comp-a",
                component: { Text: { text: { path: "/name" } } },
              },
            ],
          },
        },
        { surfaceId: "A", beginRendering: { root: "comp-a" } },
        // Surface B
        {
          surfaceId: "B",
          dataModelUpdate: { contents: { name: "Surface B Data" } },
        },
        {
          surfaceId: "B",
          surfaceUpdate: {
            components: [
              {
                id: "comp-b",
                component: { Text: { text: { path: "/name" } } },
              },
            ],
          },
        },
        { surfaceId: "B", beginRendering: { root: "comp-b" } },
      ]);

      const surfaces = processor.getSurfaces();
      assert.strictEqual(surfaces.size, 2);

      const surfaceA = surfaces.get("A");
      const surfaceB = surfaces.get("B");

      assert.ok(surfaceA && surfaceB, "Both surfaces should exist");

      // Check Surface A
      assert.strictEqual(surfaceA.components.size, 1);
      assert.ok(surfaceA.components.has("comp-a"));
      assert.deepStrictEqual(toPlainObject(surfaceA.dataModel), {
        name: "Surface A Data",
      });

      // Check Surface B
      assert.strictEqual(surfaceB.components.size, 1);
      assert.ok(surfaceB.components.has("comp-b"));
      assert.deepStrictEqual(toPlainObject(surfaceB.dataModel), {
        name: "Surface B Data",
      });
    });
  });
});
