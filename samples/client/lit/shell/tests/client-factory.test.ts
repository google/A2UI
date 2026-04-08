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

import test from "node:test";
import assert from "node:assert/strict";
import {
  createA2AClientWithRetry,
  isRetryableAgentCardError,
} from "../a2a-client-factory.js";

test("createA2AClientWithRetry retries connection errors until success", async () => {
  let attempts = 0;
  const delays: number[] = [];
  const fakeClient = { kind: "client" };

  const result = await createA2AClientWithRetry(
    "http://localhost:10002/.well-known/agent-card.json",
    {
      attempts: 4,
      initialDelayMs: 10,
      maxDelayMs: 20,
      backoffMultiplier: 2,
      sleep: async (ms) => {
        delays.push(ms);
      },
      clientFactory: async () => {
        attempts += 1;
        if (attempts < 3) {
          throw new TypeError("fetch failed: ECONNREFUSED");
        }
        return fakeClient as never;
      },
    }
  );

  assert.equal(result, fakeClient);
  assert.equal(attempts, 3);
  assert.deepEqual(delays, [10, 20]);
});

test("createA2AClientWithRetry does not retry non-network errors", async () => {
  let attempts = 0;

  await assert.rejects(
    createA2AClientWithRetry("http://localhost:10002/.well-known/agent-card.json", {
      attempts: 4,
      sleep: async () => {},
      clientFactory: async () => {
        attempts += 1;
        throw new Error("invalid agent card payload");
      },
    }),
    /invalid agent card payload/
  );

  assert.equal(attempts, 1);
});

test("isRetryableAgentCardError matches common startup failures", () => {
  assert.equal(isRetryableAgentCardError(new Error("fetch failed")), true);
  assert.equal(isRetryableAgentCardError(new Error("socket ECONNREFUSED")), true);
  assert.equal(isRetryableAgentCardError(new Error("invalid agent card payload")), false);
});
