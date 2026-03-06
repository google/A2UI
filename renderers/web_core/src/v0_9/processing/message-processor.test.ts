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
import { MessageProcessor } from "./message-processor.js";
import { Catalog, ComponentApi } from "../catalog/types.js";

describe("MessageProcessor", () => {
  let processor: MessageProcessor<ComponentApi>;
  let testCatalog: Catalog<ComponentApi>;
  let actions: any[] = [];

  beforeEach(() => {
    actions = [];
    testCatalog = new Catalog("test-catalog", []);
    processor = new MessageProcessor<ComponentApi>([testCatalog], async (a) => {
      actions.push(a);
    });
  });

  it("creates surface", () => {
    processor.processMessages([
      {
        version: "v0.9",
        createSurface: {
          surfaceId: "s1",
          catalogId: "test-catalog",
          theme: {},
        },
      },
    ]);
    const surface = processor.model.getSurface("s1");
    assert.ok(surface);
    assert.strictEqual(surface.id, "s1");
  });

  it("updates components on correct surface", () => {
    processor.processMessages([
      {
        version: "v0.9",
        createSurface: { surfaceId: "s1", catalogId: "test-catalog" },
      },
    ]);

    processor.processMessages([
      {
        version: "v0.9",
        updateComponents: {
          surfaceId: "s1",
          components: [{ id: "root", component: "Box" }],
        },
      },
    ]);

    const surface = processor.model.getSurface("s1");
    assert.ok(surface?.componentsModel.get("root"));
  });

  it("updates existing components via message", () => {
    processor.processMessages([
      {
        version: "v0.9",
        createSurface: { surfaceId: "s1", catalogId: "test-catalog" },
      },
    ]);

    // Verify component creation.
    processor.processMessages([
      {
        version: "v0.9",
        updateComponents: {
          surfaceId: "s1",
          components: [{ id: "btn", component: "Button", label: "Initial" }],
        },
      },
    ]);

    const surface = processor.model.getSurface("s1");
    const btn = surface?.componentsModel.get("btn");
    assert.strictEqual(btn?.properties.label, "Initial");

    // Verify component update.
    processor.processMessages([
      {
        version: "v0.9",
        updateComponents: {
          surfaceId: "s1",
          components: [{ id: "btn", component: "Button", label: "Updated" }],
        },
      },
    ]);

    assert.strictEqual(btn?.properties.label, "Updated");
  });

  it("deletes surface", () => {
    processor.processMessages([
      {
        version: "v0.9",
        createSurface: { surfaceId: "s1", catalogId: "test-catalog" },
      },
    ]);
    assert.ok(processor.model.getSurface("s1"));

    processor.processMessages([
      {
        version: "v0.9",
        deleteSurface: { surfaceId: "s1" },
      },
    ]);
    assert.strictEqual(processor.model.getSurface("s1"), undefined);
  });

  it("routes data model updates", () => {
    processor.processMessages([
      {
        version: "v0.9",
        createSurface: { surfaceId: "s1", catalogId: "test-catalog" },
      },
    ]);

    processor.processMessages([
      {
        version: "v0.9",
        updateDataModel: {
          surfaceId: "s1",
          path: "/foo",
          value: "bar",
        },
      },
    ]);

    const surface = processor.model.getSurface("s1");
    assert.strictEqual(surface?.dataModel.get("/foo"), "bar");
  });

  it("notifies lifecycle listeners", () => {
    let created: any = null;
    let deletedId: string | null = null;

    const sub = processor.onSurfaceCreated((s) => {
      created = s;
    });
    const sub2 = processor.onSurfaceDeleted((id) => {
      deletedId = id;
    });

    // Verify creation notification.
    processor.processMessages([
      {
        version: "v0.9",
        createSurface: { surfaceId: "s1", catalogId: "test-catalog" },
      },
    ]);
    assert.ok(created);
    assert.strictEqual(created.id, "s1");

    // Verify deletion notification.
    processor.processMessages([
      {
        version: "v0.9",
        deleteSurface: { surfaceId: "s1" },
      },
    ]);
    assert.strictEqual(deletedId, "s1");

    // Verify unsubscribe stops notifications.
    created = null;
    sub.unsubscribe();
    processor.processMessages([
      {
        version: "v0.9",
        createSurface: { surfaceId: "s2", catalogId: "test-catalog" },
      },
    ]);
    assert.strictEqual(created, null);

    sub2.unsubscribe();
  });
  it("throws on message with multiple update types", () => {
    processor.processMessages([
      {
        version: "v0.9",
        createSurface: { surfaceId: "s1", catalogId: "test-catalog" },
      },
    ]);

    assert.throws(() => {
      processor.processMessages([
        {
          version: "v0.9",
          updateComponents: { surfaceId: "s1", components: [] },
          updateDataModel: { surfaceId: "s1", path: "/", value: {} },
        } as any,
      ]);
    }, /Message contains multiple update types/);
  });

  it("throws when creating component without type", () => {
    processor.processMessages([
      {
        version: "v0.9",
        createSurface: { surfaceId: "s1", catalogId: "test-catalog" },
      },
    ]);

    assert.throws(() => {
      processor.processMessages([
        {
          version: "v0.9",
          updateComponents: {
            surfaceId: "s1",
            components: [{ id: "comp1", label: "No Type" } as any],
          },
        },
      ]);
    }, /Cannot create component comp1 without a type/);
    const surface = processor.model.getSurface("s1");
    assert.strictEqual(surface?.componentsModel.get("comp1"), undefined);
  });

  it("recreates component when type changes", () => {
    processor.processMessages([
      {
        version: "v0.9",
        createSurface: { surfaceId: "s1", catalogId: "test-catalog" },
      },
    ]);

    processor.processMessages([
      {
        version: "v0.9",
        updateComponents: {
          surfaceId: "s1",
          components: [{ id: "comp1", component: "Button", label: "Btn" }],
        },
      },
    ]);

    let surface = processor.model.getSurface("s1");
    let comp = surface?.componentsModel.get("comp1");
    assert.strictEqual(comp?.type, "Button");

    // Change type to Label
    processor.processMessages([
      {
        version: "v0.9",
        updateComponents: {
          surfaceId: "s1",
          components: [{ id: "comp1", component: "Label", text: "Lbl" }],
        },
      },
    ]);

    surface = processor.model.getSurface("s1");
    comp = surface?.componentsModel.get("comp1");
    assert.strictEqual(comp?.type, "Label");
    assert.strictEqual(comp?.properties.text, "Lbl");
    assert.strictEqual(comp?.properties.label, undefined);
  });

  it("throws when catalog not found", () => {
    assert.throws(() => {
      processor.processMessages([
        {
          version: "v0.9",
          createSurface: {
            surfaceId: "s1",
            catalogId: "unknown-catalog",
          },
        },
      ]);
    }, /Catalog not found: unknown-catalog/);
  });

  it("throws when duplicate surface created", () => {
    processor.processMessages([
      {
        version: "v0.9",
        createSurface: { surfaceId: "s1", catalogId: "test-catalog" },
      },
    ]);

    assert.throws(() => {
      processor.processMessages([
        {
          version: "v0.9",
          createSurface: { surfaceId: "s1", catalogId: "test-catalog" },
        },
      ]);
    }, /Surface s1 already exists/);
  });

  it("throws when updating non-existent surface", () => {
    assert.throws(() => {
      processor.processMessages([
        {
          version: "v0.9",
          updateComponents: {
            surfaceId: "unknown-s",
            components: [] as any,
          },
        },
      ]);
    }, /Surface not found for message: unknown-s/);
  });

  it("throws when component is missing id", () => {
    processor.processMessages([
      {
        version: "v0.9",
        createSurface: { surfaceId: "s1", catalogId: "test-catalog" },
      },
    ]);
    assert.throws(() => {
      processor.processMessages([
        {
          version: "v0.9",
          updateComponents: {
            surfaceId: "s1",
            components: [{ component: "Button" } as any],
          },
        },
      ]);
    }, /missing an 'id'/);
  });

  it("throws when updating data on non-existent surface", () => {
    assert.throws(() => {
      processor.processMessages([
        {
          version: "v0.9",
          updateDataModel: { surfaceId: "unknown-s", path: "/", value: {} },
        },
      ]);
    }, /Surface not found for message: unknown-s/);
  });

  it("resolves paths correctly via resolvePath", () => {
    assert.strictEqual(processor.resolvePath("/foo", "/bar"), "/foo");
    assert.strictEqual(processor.resolvePath("foo", "/bar"), "/bar/foo");
    assert.strictEqual(processor.resolvePath("foo", "/bar/"), "/bar/foo");
    assert.strictEqual(processor.resolvePath("foo"), "/foo");
  });

  describe("Batch Processing", () => {
    it("batches multiple updateDataModel messages into single notification cycle", () => {
      processor.processMessages([
        {
          version: "v0.9",
          createSurface: { surfaceId: "s1", catalogId: "test-catalog" },
        },
      ]);

      const surface = processor.model.getSurface("s1")!;
      const notifications: string[] = [];

      surface.dataModel.subscribe("/user/name", () => notifications.push("name"));
      surface.dataModel.subscribe("/user/age", () => notifications.push("age"));
      surface.dataModel.subscribe("/user", () => notifications.push("user"));

      // Process multiple updates in one batch
      processor.processMessages([
        {
          version: "v0.9",
          updateDataModel: { surfaceId: "s1", path: "/user/name", value: "Alice" },
        },
        {
          version: "v0.9",
          updateDataModel: { surfaceId: "s1", path: "/user/age", value: 30 },
        },
        {
          version: "v0.9",
          updateDataModel: { surfaceId: "s1", path: "/user/email", value: "alice@example.com" },
        },
      ]);

      // All paths should be notified
      assert.ok(notifications.includes("name"), "name path notified");
      assert.ok(notifications.includes("age"), "age path notified");
      assert.ok(notifications.includes("user"), "user path notified");

      // Each path should only be notified once (deduplication)
      assert.strictEqual(
        notifications.filter((n) => n === "name").length,
        1,
        "name notified exactly once"
      );
    });

    it("does not batch single message", () => {
      processor.processMessages([
        {
          version: "v0.9",
          createSurface: { surfaceId: "s1", catalogId: "test-catalog" },
        },
      ]);

      const surface = processor.model.getSurface("s1")!;
      let notificationCount = 0;

      surface.dataModel.subscribe("/value", () => notificationCount++);

      // Single message - should not use batch mode
      processor.processMessages([
        {
          version: "v0.9",
          updateDataModel: { surfaceId: "s1", path: "/value", value: "test" },
        },
      ]);

      assert.strictEqual(notificationCount, 1, "Single message notified immediately");
    });

    it("handles multiple surfaces in one batch", () => {
      processor.processMessages([
        {
          version: "v0.9",
          createSurface: { surfaceId: "s1", catalogId: "test-catalog" },
        },
        {
          version: "v0.9",
          createSurface: { surfaceId: "s2", catalogId: "test-catalog" },
        },
      ]);

      const surface1 = processor.model.getSurface("s1")!;
      const surface2 = processor.model.getSurface("s2")!;

      let count1 = 0;
      let count2 = 0;

      surface1.dataModel.subscribe("/value", () => count1++);
      surface2.dataModel.subscribe("/value", () => count2++);

      // Update both surfaces in one batch
      processor.processMessages([
        {
          version: "v0.9",
          updateDataModel: { surfaceId: "s1", path: "/value", value: "a" },
        },
        {
          version: "v0.9",
          updateDataModel: { surfaceId: "s2", path: "/value", value: "b" },
        },
      ]);

      assert.strictEqual(count1, 1, "surface-1 notified once");
      assert.strictEqual(count2, 1, "surface-2 notified once");
    });

    it("clears pending notifications on error", () => {
      processor.processMessages([
        {
          version: "v0.9",
          createSurface: { surfaceId: "s1", catalogId: "test-catalog" },
        },
      ]);

      const surface = processor.model.getSurface("s1")!;
      let notificationCount = 0;

      surface.dataModel.subscribe("/value", () => notificationCount++);

      // Try to process messages that will cause an error
      try {
        processor.processMessages([
          {
            version: "v0.9",
            updateDataModel: { surfaceId: "s1", path: "/value", value: "updated" },
          },
          {
            version: "v0.9",
            updateDataModel: { surfaceId: "non-existent", path: "/value", value: "error" },
          },
        ]);
      } catch (e) {
        // Expected error
      }

      // Data was written before the error
      assert.strictEqual(surface.dataModel.get("/value"), "updated");
      // Pending notifications should have been cleared, not fired
      assert.strictEqual(notificationCount, 0, "No notifications fired due to error");
    });
  });
});
