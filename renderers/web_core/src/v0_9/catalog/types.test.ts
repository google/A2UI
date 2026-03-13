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
import { describe, it } from "node:test";
import { Catalog, ComponentApi, createFunctionImplementation } from "./types.js";
import { z } from "zod";

describe("Catalog Types", () => {
  it("creates a catalog with functions", () => {
    const mockComponent: ComponentApi = {
      name: "MockComp",
      schema: z.object({}),
    };

    const mockFunc = createFunctionImplementation(
      {
        name: "mockFunc",
        returnType: "string",
        schema: z.object({})
      },
      () => "result"
    );

    const catalog = new Catalog(
      "test-cat",
      [mockComponent],
      [mockFunc]
    );

    assert.strictEqual(catalog.id, "test-cat");
    assert.strictEqual(catalog.components.size, 1);
    assert.strictEqual(catalog.components.get("MockComp"), mockComponent);

    assert.ok(catalog.functions);
    assert.strictEqual(catalog.functions.size, 1);
    assert.strictEqual(catalog.functions.get("mockFunc"), mockFunc);
  });
});
