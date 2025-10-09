/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "node:assert";
import { describe, it } from "node:test";

import { DataModel } from "../../0.7/data/model.js";
import { data as restaurantData } from "./test-data-restaurant.js";
import { data as londonData } from "./test-data-london.js";

const wait = <T>(t: number, v: T) =>
  new Promise<T>((r) => setTimeout(() => r(v), t));

describe("DataModel", () => {
  it("throws for empty data sets", () => {
    assert.throws(() => {
      const model = new DataModel();
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      model.current;
    });
  });

  it("handles incremental data sets", async () => {
    const model = new DataModel();
    await model.append([{ version: "0.7" }]);
    await model.append([{ root: "root" }]);
    await model.append([
      {
        components: [
          {
            id: "root",
            componentProperties: {
              Text: {
                text: {
                  path: "/value",
                },
              },
            },
          },
        ],
      },
    ]);
    await model.append([{ path: "/", contents: { value: "incremental" } }]);

    assert.equal(await model.getDataProperty("/value"), "incremental");
  });

  describe("which is not finalized", () => {
    it("handles data (not prefixed)", async () => {
      const model = new DataModel();
      await model.append([{ version: "0.7" }, { root: "root" }]);

      // Since the model is not finalized this call will create a Promise which
      // should be resolved when the value arrives.
      const checker = model.getDataProperty("/data/value");

      await model.setDataProperty("/data/value", "", "tree");
      const newValue = await checker;
      assert.equal(newValue, "tree");
    });

    it("handles data (prefixed)", async () => {
      const model = new DataModel();
      await model.append([{ version: "0.7" }, { root: "root" }]);

      // Since the model is not finalized this call will create a Promise which
      // should be resolved when the value arrives.
      const checker = model.getDataProperty("/data/value");

      await model.setDataProperty("value", "data", "tree");
      const newValue = await checker;
      assert.equal(newValue, "tree");
    });

    it("times out on data (prefixed)", async () => {
      const model = new DataModel();
      await model.append([{ version: "0.7" }, { root: "root" }]);

      // Since the model is not finalized this call will create a Promise which
      // should be resolved when the value arrives. Howeever, this value is not
      // going to be set so there should be a timeout.
      const checker = model.getDataProperty("/data/value");

      await model.setDataProperty("value", "foo", "tree");
      const newValue = await Promise.race([checker, wait(30, "timeout")]);
      assert.equal(newValue, "timeout");
    });
  });

  describe("which is finalized", () => {
    it("handles basic data", async () => {
      const model = new DataModel();

      await model.append([
        { version: "0.7" },
        { root: "root" },
        {
          path: "/data",
          contents: {
            value: "tree",
            empty: "",
            num: 30,
          },
        },
      ]);
      await model.finalize();

      // Check for known values.
      assert.equal(await model.getDataProperty("/data/value"), "tree");
      assert.equal(await model.getDataProperty("/data/empty"), "");
      assert.equal(await model.getDataProperty("/data/num"), 30);

      // Check for unknown values.
      assert.equal(await model.getDataProperty("/unknown"), null);
    });

    it("returns null for non-existent data", async () => {
      const model = new DataModel();
      await model.append([{ version: "0.7" }, { root: "root" }]);
      await model.finalize();

      const value = await model.getDataProperty("/data/value");
      assert.equal(value, null);
    });

    it("handles arrays", async () => {
      const items = [
        {
          name: "One",
        },
        {
          name: "Two",
        },
        {
          name: "Three",
        },
      ];
      const model = new DataModel();
      await model.append([
        { version: "0.7" },
        { root: "root" },
        {
          path: "/",
          contents: {
            items,
          },
        },
      ]);
      await model.finalize();

      const values = await model.getDataProperty("/items");
      assert.notStrictEqual(values, null);
      if (!Array.isArray(values)) {
        assert.fail("Expected Array");
      }

      const personValues = values as unknown as typeof items;
      assert.equal(personValues[0].name, "One");
      assert.equal(personValues[1].name, "Two");
      assert.equal(personValues[2].name, "Three");
    });
  });

  describe("Components", () => {
    it("expands templates (restaurant)", async () => {
      const model = new DataModel();
      await model.append(restaurantData);
      await model.finalize();

      if (!model.current) {
        assert.fail("No valid model");
      }

      if (!model.current.root.componentProperties.Column) {
        assert.fail("Expected Column");
      }

      const mainColumn = model.current.root.componentProperties.Column;
      assert.equal(Object.keys(mainColumn.children).length, 2);

      const mainColumnChildren = mainColumn.children;
      if (!Array.isArray(mainColumnChildren)) {
        assert.fail("Expected child array");
      }

      // Check Heading.
      const heading = mainColumnChildren[0];
      assert.ok(
        "Heading" in heading.componentProperties &&
          heading.componentProperties.Heading
      );
      assert.ok(
        "literalString" in heading.componentProperties.Heading.text &&
          heading.componentProperties.Heading.text.literalString
      );
      assert.strictEqual(
        heading.componentProperties.Heading.text.literalString,
        "Restaurants in Mountain View"
      );

      // Check expanded template.
      const list = mainColumnChildren[1];
      assert.ok(
        "List" in list.componentProperties && list.componentProperties.List
      );
      assert.ok(
        Array.isArray(list.componentProperties.List.children) &&
          list.componentProperties.List.children.length === 3
      );
    });

    it("expands templates (London)", async () => {
      const model = new DataModel();
      await model.append(londonData);
      await model.finalize();

      if (!model.current) {
        assert.fail("No valid model");
      }

      if (!model.current.root.componentProperties.List) {
        assert.fail("Expected List");
      }

      const mainList = model.current.root.componentProperties.List;
      assert.equal(Object.keys(mainList.children).length, 3);

      const mainColumnChildren = mainList.children;
      if (!Array.isArray(mainColumnChildren)) {
        assert.fail("Expected child array");
      }
    });
  });
});
