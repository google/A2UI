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
import { isHintedStyles } from "./ui/hinted-styles.js";

describe("isHintedStyles", () => {
  it("accepts partial hinted text styles", () => {
    assert.strictEqual(
      isHintedStyles({
        body: { color: "red" },
        h1: { fontWeight: "700" },
      }),
      true
    );
  });

  it("rejects flat style maps", () => {
    assert.strictEqual(
      isHintedStyles({
        color: "red",
        fontWeight: "700",
      }),
      false
    );
  });

  it("rejects scalar hinted keys", () => {
    assert.strictEqual(
      isHintedStyles({
        body: "red",
      }),
      false
    );
  });
});
