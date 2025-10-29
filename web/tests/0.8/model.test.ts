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
    const obj: Record<string, unknown> = {};
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
  let processor = new v0_8.Data.A2UIModelProcessor();

  beforeEach(() => {
    processor = new v0_8.Data.A2UIModelProcessor();
  });

  describe("Basic Initialization and State", () => {
    it("should start with no surfaces", () => {
      assert.strictEqual(processor.getSurfaces().size, 0);
    });

    it("should clear surfaces when clearSurfaces is called", () => {
      processor.processMessages([
        {
          beginRendering: {
            root: "root",
            surfaceId: "@default",
          },
        },
      ]);
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
            surfaceId: "@default",
          },
        },
      ]);
      const surfaces = processor.getSurfaces();
      assert.strictEqual(surfaces.size, 1);

      const defaultSurface = surfaces.get("@default");
      assert.ok(defaultSurface, "Default surface should exist");
      assert.strictEqual(defaultSurface.rootComponentId, "comp-a");
      assert.deepStrictEqual(defaultSurface.styles, { color: "blue" });
    });

    it("should handle `surfaceUpdate` by adding components", () => {
      const messages = [
        {
          surfaceUpdate: {
            surfaceId: "@default",
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
        {
          beginRendering: { root: "root", surfaceId: "to-delete" },
        },
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
            surfaceId: "@default",
            path: "/user",
            contents: [{ key: "name", valueString: "Alice" }],
          },
        },
      ]);
      const name = processor.getData(
        { dataContextPath: "/" } as v0_8.Types.AnyComponentNode,
        "/user/name"
      );
      assert.strictEqual(name, "Alice");
    });

    it("should replace the entire data model when path is not provided", () => {
      processor.processMessages([
        {
          dataModelUpdate: {
            surfaceId: "@default",
            path: "/",
            contents: [
              { key: "user", valueString: JSON.stringify({ name: "Bob" }) },
            ],
          },
        },
      ]);
      const user = processor.getData(
        { dataContextPath: "/" } as v0_8.Types.AnyComponentNode,
        "/user"
      );
      assert.deepStrictEqual(toPlainObject(user), { name: "Bob" });
    });

    it("should create nested structures when setting data", () => {
      const component = { dataContextPath: "/" } as v0_8.Types.AnyComponentNode;
      // Note: setData is a public method that does not use the key-value format
      processor.setData(component, "/a/b/c", "value");
      const data = processor.getData(component, "/a/b/c");
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

    it("should correctly parse nested valueMap structures", () => {
      processor.processMessages([
        {
          dataModelUpdate: {
            surfaceId: "@default",
            path: "/data",
            contents: [
              {
                key: "users", // /data/users
                valueMap: [
                  {
                    key: "user1", // /data/users/user1
                    valueMap: [
                      {
                        key: "firstName",
                        valueString: "Alice",
                      },
                      {
                        key: "lastName",
                        valueString: "Doe",
                      },
                    ],
                  },
                  {
                    key: "user2", // /data/users/user2
                    valueMap: [
                      {
                        key: "firstName",
                        valueString: "John",
                      },
                      {
                        key: "lastName",
                        valueString: "Doe",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      ]);

      const info = processor.getData(
        { dataContextPath: "/" } as v0_8.Types.AnyComponentNode,
        "/data/users"
      );

      // The expected result is a Map of Maps.
      const expected = new Map([
        [
          "user1",
          new Map([
            ["firstName", "Alice"],
            ["lastName", "Doe"],
          ]),
        ],
        [
          "user2",
          new Map([
            ["firstName", "John"],
            ["lastName", "Doe"],
          ]),
        ],
      ]);

      assert.deepEqual(info, expected);
    });
  });

  describe("Component Tree Building", () => {
    it("should build a simple parent-child tree", () => {
      processor.processMessages([
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

      const tree = processor.getSurfaces().get("@default")?.componentTree;
      const plainTree = toPlainObject(tree);

      assert.strictEqual(plainTree.id, "root");
      assert.strictEqual(plainTree.type, "Column");
      assert.strictEqual(plainTree.properties.children.length, 1);
      assert.strictEqual(plainTree.properties.children[0].id, "child");
      assert.strictEqual(plainTree.properties.children[0].type, "Text");
    });

    it("should throw an error on circular dependencies", () => {
      // First, load the components
      processor.processMessages([
        {
          surfaceUpdate: {
            surfaceId: "@default",
            components: [
              { id: "a", component: { Card: { child: "b" } } },
              { id: "b", component: { Card: { child: "a" } } },
            ],
          },
        },
      ]);

      // Now, try to render, which triggers the tree build
      assert.throws(() => {
        processor.processMessages([
          {
            beginRendering: {
              root: "a",
              surfaceId: "@default",
            },
          },
        ]);
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
            surfaceId: "@default",
            path: "/",
            contents: [
              {
                key: "items",
                valueString: JSON.stringify([{ name: "A" }, { name: "B" }]),
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

      const tree = processor.getSurfaces().get("@default")?.componentTree;
      const plainTree = toPlainObject(tree);

      assert.strictEqual(plainTree.properties.children.length, 2);

      // Check first generated child.
      const child1 = plainTree.properties.children[0];
      assert.strictEqual(child1.id, "item-template:0");
      assert.strictEqual(child1.type, "Text");
      assert.strictEqual(child1.dataContextPath, "/items/0");
      assert.deepStrictEqual(child1.properties.text, { path: "name" });

      // Check second generated child.
      const child2 = plainTree.properties.children[1];
      assert.strictEqual(child2.id, "item-template:1");
      assert.strictEqual(child2.type, "Text");
      assert.strictEqual(child2.dataContextPath, "/items/1");
      assert.deepStrictEqual(child2.properties.text, { path: "name" });
    });

    it("should rebuild the tree when data for a template arrives later", () => {
      processor.processMessages([
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
            surfaceId: "@default",
            path: "/",
            contents: [
              {
                key: "items",
                valueString: JSON.stringify([{ name: "A" }, { name: "B" }]),
              },
            ],
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
            surfaceId: "@default",
            path: "/",
            contents: [
              {
                key: "items",
                valueString: JSON.stringify([{ name: "A" }, { name: "B" }]),
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
              // These paths would are typical when a databinding is used.
              {
                id: "item-template",
                component: { Text: { text: { path: "./item/name" } } },
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
            surfaceId: "@default",
            path: "/",
            contents: [
              {
                key: "items",
                valueString: JSON.stringify([{ name: "A" }, { name: "B" }]),
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
              // These paths would are typical when a databinding is used.
              {
                id: "item-template",
                component: { Text: { text: { path: "./name" } } },
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

      const tree = processor.getSurfaces().get("@default")?.componentTree;
      const plainTree = toPlainObject(tree);
      const child1 = plainTree.properties.children[0];
      const child2 = plainTree.properties.children[1];

      // The processor should have trimmed `./` from the path
      // because we are inside a data context.
      assert.deepEqual(child1.properties.text, { path: "name" });
      assert.deepEqual(child2.properties.text, { path: "name" });
    });
  });

  describe("Data Normalization and Parsing", () => {
    it("should correctly handle and parse the key-value array data format at the root", () => {
      const messages = [
        {
          dataModelUpdate: {
            surfaceId: "test-surface",
            path: "/",
            contents: [
              { key: "title", valueString: "My Title" },
              {
                key: "items",
                valueString: '[{"id": 1}, {"id": 2}]',
              },
            ],
          },
        },
      ];

      processor.processMessages(messages);

      const component = { dataContextPath: "/" } as v0_8.Types.AnyComponentNode;
      const title = processor.getData(component, "/title", "test-surface");
      const items = processor.getData(component, "/items", "test-surface");

      assert.strictEqual(title, "My Title");
      assert.deepStrictEqual(toPlainObject(items), [{ id: 1 }, { id: 2 }]);
    });

    it("should fallback to a string if stringified JSON is invalid", () => {
      const invalidJSON = '[{"id": 1}, {"id": 2}'; // Missing closing bracket
      processor.processMessages([
        {
          dataModelUpdate: {
            surfaceId: "@default",
            path: "/",
            contents: [{ key: "badData", valueString: invalidJSON }],
          },
        },
      ]);

      const component = { dataContextPath: "/" } as v0_8.Types.AnyComponentNode;
      const badData = processor.getData(component, "/badData");
      assert.strictEqual(badData, invalidJSON);
    });
  });

  describe("Complex Template Scenarios", () => {
    it("should correctly expand nested templates with layered data contexts", () => {
      const messages = [
        {
          dataModelUpdate: {
            surfaceId: "@default",
            path: "/",
            contents: [
              {
                key: "days",
                // The correct way to send an array of objects is as a stringified JSON.
                valueString: JSON.stringify([
                  {
                    title: "Day 1",
                    activities: ["Morning Walk", "Museum Visit"],
                  },
                  {
                    title: "Day 2",
                    activities: ["Market Trip"],
                  },
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
        {
          beginRendering: {
            root: "root",
            surfaceId: "@default",
          },
        },
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
      assert.deepStrictEqual(day1.properties.children[0].properties.text, {
        path: "title",
      });
      assert.deepStrictEqual(day1Activities[0].properties.text, { path: "." });

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
      assert.deepStrictEqual(day2.properties.children[0].properties.text, {
        path: "title",
      });
      assert.deepStrictEqual(day2Activities[0].properties.text, { path: "." });
    });

    it("should correctly bind to primitive values in an array using path: '.'", () => {
      processor.processMessages([
        {
          dataModelUpdate: {
            surfaceId: "@default",
            path: "/",
            contents: [
              {
                key: "tags",
                valueString: JSON.stringify(["travel", "paris", "guide"]),
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
        {
          beginRendering: {
            root: "root",
            surfaceId: "@default",
          },
        },
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
          dataModelUpdate: {
            surfaceId: "A",
            path: "/",
            contents: [{ key: "name", valueString: "Surface A Data" }],
          },
        },
        {
          surfaceUpdate: {
            surfaceId: "A",
            components: [
              {
                id: "comp-a",
                component: { Text: { text: { path: "/name" } } },
              },
            ],
          },
        },
        { beginRendering: { root: "comp-a", surfaceId: "A" } },
        // Surface B
        {
          dataModelUpdate: {
            surfaceId: "B",
            path: "/",
            contents: [{ key: "name", valueString: "Surface B Data" }],
          },
        },
        {
          surfaceUpdate: {
            surfaceId: "B",
            components: [
              {
                id: "comp-b",
                component: { Text: { text: { path: "/name" } } },
              },
            ],
          },
        },
        { beginRendering: { root: "comp-b", surfaceId: "B" } },
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
      assert.deepStrictEqual(
        toPlainObject(surfaceA.componentTree).properties.text,
        { path: "/name" }
      );

      // Check Surface B
      assert.strictEqual(surfaceB.components.size, 1);
      assert.ok(surfaceB.components.has("comp-b"));
      assert.deepStrictEqual(toPlainObject(surfaceB.dataModel), {
        name: "Surface B Data",
      });
      assert.deepStrictEqual(
        toPlainObject(surfaceB.componentTree).properties.text,
        { path: "/name" }
      );
    });
  });
});
