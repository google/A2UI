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
import { SurfaceModel } from "./surface-model.js";
import { Catalog, ComponentApi } from "../catalog/types.js";
import { ComponentModel } from "./component-model.js";
import { ComponentContext } from "../rendering/component-context.js";

describe("SurfaceModel", () => {
  let surface: SurfaceModel<ComponentApi>;
  let catalog: Catalog<ComponentApi>;
  let actions: any[] = [];

  beforeEach(() => {
    actions = [];
    catalog = new Catalog("test-catalog", []);
    surface = new SurfaceModel<ComponentApi>("surface-1", catalog, {});
    surface.onAction.subscribe(async (action) => {
      actions.push(action);
    });
  });

  it("initializes with empty data model", () => {
    assert.deepStrictEqual(surface.dataModel.get("/"), {});
  });

  it("exposes components model", () => {
    surface.componentsModel.addComponent(
      new ComponentModel("c1", "Button", {}),
    );
    assert.ok(surface.componentsModel.get("c1"));
  });

  it("dispatches actions", async () => {
    await surface.dispatchAction({ event: { name: "click" } });
    assert.strictEqual(actions.length, 1);
    assert.strictEqual(actions[0].event?.name, "click");
  });

  it("creates a component context", () => {
    surface.componentsModel.addComponent(new ComponentModel("root", "Box", {}));
    const ctx = new ComponentContext(surface, "root", "/mydata");
    assert.ok(ctx);
    assert.strictEqual(ctx.dataContext.path, "/mydata");
  });

  it("disposes resources", () => {
    // Verify that the dispose method clears subscriptions and internal state.
    // Ideally, we would need to mock dependencies to verify deep disposal,
    // but here we ensure that the surface's own emitters are cleared.

    let actionReceived = false;
    surface.onAction.subscribe(() => {
      actionReceived = true;
    });

    surface.dispose();

    // After dispose, no more actions should be emitted.
    // The EventEmitter.dispose method clears all listeners.
    surface.dispatchAction({ event: { name: "click" } });
    assert.strictEqual(
      actionReceived,
      false,
      "Should not receive actions after dispose",
    );
  });
});
