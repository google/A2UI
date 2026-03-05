/*
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import assert from "node:assert";
import { describe, it, beforeEach } from "node:test";
import { A2uiMessageProcessor } from "./model-processor.js";
import { TextNode, RowNode } from "../types/types.js";

describe("A2uiMessageProcessor", () => {
  let processor: A2uiMessageProcessor;

  beforeEach(() => {
    processor = new A2uiMessageProcessor();
  });

  it("handles beginRendering", () => {
    processor.processMessages([
      {
        beginRendering: {
          surfaceId: "s1",
          root: "root",
          styles: { font: "Arial" },
        },
      },
    ]);

    const surfaces = processor.getSurfaces();
    const surface = surfaces.get("s1");
    assert.ok(surface);
    assert.strictEqual(surface.rootComponentId, "root");
    assert.deepStrictEqual(surface.styles, { font: "Arial" });
    // The component tree remains null until components are added via surfaceUpdate.
    assert.strictEqual(surface.componentTree, null);
  });

  it("handles surfaceUpdate", () => {
    processor.processMessages([
      {
        beginRendering: { surfaceId: "s1", root: "root" },
      },
    ]);

    processor.processMessages([
      {
        surfaceUpdate: {
          surfaceId: "s1",
          components: [
            {
              id: "root",
              component: {
                Text: { text: { literal: "Hello" }, usageHint: "body" },
              } as any,
            },
          ],
        },
      },
    ]);

    const surface = processor.getSurfaces().get("s1");
    assert.ok(surface);
    assert.ok(surface.componentTree);
    const root = surface.componentTree as TextNode;
    assert.strictEqual(root.id, "root");
    assert.strictEqual(root.type, "Text");
    // The property preserves the literal wrapper
    assert.deepStrictEqual(root.properties.text, { literal: "Hello" });
  });

  it("handles dataModelUpdate", () => {
    processor.processMessages([
      {
        beginRendering: { surfaceId: "s1", root: "root" },
      },
      {
        dataModelUpdate: {
          surfaceId: "s1",
          contents: [{ key: "message", valueString: "World" }],
        },
      },
    ]);

    const surface = processor.getSurfaces().get("s1");
    assert.strictEqual(surface?.dataModel.get("message"), "World");
  });

  it("handles deleteSurface", () => {
    processor.processMessages([
      {
        beginRendering: { surfaceId: "s1", root: "root" },
      },
    ]);
    assert.ok(processor.getSurfaces().has("s1"));

    processor.processMessages([
      {
        deleteSurface: { surfaceId: "s1" },
      },
    ]);
    assert.ok(!processor.getSurfaces().has("s1"));
  });

  it("resolves component references (children)", () => {
    processor.processMessages([
      { beginRendering: { surfaceId: "s1", root: "row" } },
      {
        surfaceUpdate: {
          surfaceId: "s1",
          components: [
            {
              id: "row",
              component: {
                Row: { children: { explicitList: ["t1", "t2"] } },
              } as any,
            },
            {
              id: "t1",
              component: {
                Text: { text: { literal: "One" }, usageHint: "body" },
              } as any,
            },
            {
              id: "t2",
              component: {
                Text: { text: { literal: "Two" }, usageHint: "body" },
              } as any,
            },
          ],
        },
      },
    ]);

    const surface = processor.getSurfaces().get("s1");
    const root = surface?.componentTree as RowNode;
    assert.strictEqual(root.type, "Row");
    assert.strictEqual(root.properties.children.length, 2);
    assert.deepStrictEqual(
      (root.properties.children[0] as TextNode).properties.text,
      { literal: "One" },
    );
    assert.deepStrictEqual(
      (root.properties.children[1] as TextNode).properties.text,
      { literal: "Two" },
    );
  });

  it("resolves templates", () => {
    processor.processMessages([
      { beginRendering: { surfaceId: "s1", root: "row" } },
      {
        dataModelUpdate: {
          surfaceId: "s1",
          contents: [
            {
              key: "items",
              valueMap: [
                { key: "0", valueString: "Item A" },
                { key: "1", valueString: "Item B" },
              ],
            },
          ],
        },
      },
      {
        surfaceUpdate: {
          surfaceId: "s1",
          components: [
            {
              id: "row",
              component: {
                Row: {
                  children: {
                    template: {
                      componentId: "item",
                      dataBinding: "/items",
                    },
                  },
                },
              } as any,
            },
            {
              id: "item",
              component: {
                Text: { text: { path: "." }, usageHint: "body" },
              } as any,
            },
          ],
        },
      },
    ]);

    const surface = processor.getSurfaces().get("s1");
    const root = surface?.componentTree as RowNode;
    assert.strictEqual(root.type, "Row");
    assert.strictEqual(root.properties.children.length, 2);

    // Verify template expansion
    const child0 = root.properties.children[0] as TextNode;
    const child1 = root.properties.children[1] as TextNode;

    // Check that binding paths are correct (processor does NOT resolve the value, just the binding path context)
    assert.deepStrictEqual(child0.properties.text, { path: "." });

    // Now verify we can resolve the data using the node's context
    const textProp0 = child0.properties.text as { path: string };
    const resolvedValue0 = processor.getData(child0, textProp0.path, "s1");
    assert.strictEqual(resolvedValue0, "Item A");

    const textProp1 = child1.properties.text as { path: string };
    const resolvedValue1 = processor.getData(child1, textProp1.path, "s1");
    assert.strictEqual(resolvedValue1, "Item B");
  });

  it("getData resolves paths relative to node context", () => {
    processor.processMessages([
      { beginRendering: { surfaceId: "s1", root: "root" } },
      {
        dataModelUpdate: {
          surfaceId: "s1",
          contents: [
            { key: "user", valueMap: [{ key: "name", valueString: "Alice" }] },
          ],
        },
      },
    ]);

    processor.getSurfaces().get("s1");
    const node = { id: "test", dataContextPath: "/user" } as any;

    const name = processor.getData(node, "name", "s1");
    assert.strictEqual(name, "Alice");

    const self = processor.getData(node, ".", "s1");
    assert.ok(self instanceof Map);
    assert.strictEqual((self as Map<string, any>).get("name"), "Alice");

    const rootData = processor.getData(node, "/user/name", "s1");
    assert.strictEqual(rootData, "Alice");
  });

  it("setData updates data model", () => {
    processor.processMessages([
      { beginRendering: { surfaceId: "s1", root: "root" } },
    ]);
    const surface = processor.getSurfaces().get("s1");
    const node = { id: "test", dataContextPath: "/" } as any;

    processor.setData(node, "count", 42, "s1");
    assert.strictEqual(surface?.dataModel.get("count"), 42);

    processor.setData(node, "/nested/value", "foo", "s1");
    const nested = surface?.dataModel.get("nested") as Map<string, any>;
    assert.strictEqual(nested.get("value"), "foo");
  });

  it("normalizes paths correctly", () => {
    const p = (processor as any).normalizePath("users[0].name");
    assert.strictEqual(p, "/users/0/name");
  });

  it("parses JSON strings in data", () => {
    processor.processMessages([
      { beginRendering: { surfaceId: "s1", root: "root" } },
    ]);

    // Explicitly testing private/internal parsing logic via public update
    processor.processMessages([
      {
        dataModelUpdate: {
          surfaceId: "s1",
          contents: [{ key: "config", valueString: '{"theme":"dark"}' }],
        },
      },
    ]);

    const surface = processor.getSurfaces().get("s1");
    const config = surface?.dataModel.get("config") as any;
    assert.deepStrictEqual(config, { theme: "dark" });
  });
});
