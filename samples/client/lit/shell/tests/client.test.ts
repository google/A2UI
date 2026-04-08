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
import { v0_8 } from "@a2ui/lit";
import { convertA2APartsToMessages } from "../client.js";
import type { Part } from "@a2a-js/sdk";

test("convertA2APartsToMessages preserves A2UI data parts", () => {
  const beginRendering: v0_8.Types.ServerToClientMessage = {
    beginRendering: {
      root: "root",
      surfaceId: "@default",
    },
  };

  const messages = convertA2APartsToMessages([
    {
      kind: "data",
      data: beginRendering as unknown as Record<string, unknown>,
      mimeType: "application/json+a2ui",
    } as Part,
    {
      kind: "text",
      text: "This should not replace a valid A2UI response.",
    } as Part,
  ]);

  assert.deepEqual(messages, [beginRendering]);
});

test("convertA2APartsToMessages converts a text-only fallback into renderable messages", () => {
  const messages = convertA2APartsToMessages([
    {
      kind: "text",
      text: "Oops, I couldn't find anything you requested.",
    } as Part,
  ]);

  assert.equal(messages.length, 2);
  assert.deepEqual(messages[0], {
    beginRendering: {
      root: "__a2ui_text_fallback_0",
      surfaceId: "@default",
    },
  });

  const processor = new v0_8.Data.A2uiMessageProcessor();
  processor.processMessages(messages);

  const surface = processor.getSurfaces().get("@default");
  assert.ok(surface);
  assert.equal(surface.rootComponentId, "__a2ui_text_fallback_0");
  assert.ok(surface.components.has("__a2ui_text_fallback_0"));
});

test("convertA2APartsToMessages stacks multiple text fallbacks into a column", () => {
  const messages = convertA2APartsToMessages([
    { kind: "text", text: "First fallback" } as Part,
    { kind: "text", text: "Second fallback" } as Part,
  ]);

  const processor = new v0_8.Data.A2uiMessageProcessor();
  processor.processMessages(messages);

  const surface = processor.getSurfaces().get("@default");
  assert.ok(surface);
  assert.equal(surface.rootComponentId, "__a2ui_text_fallback_root");
  assert.ok(surface.components.has("__a2ui_text_fallback_0"));
  assert.ok(surface.components.has("__a2ui_text_fallback_1"));
});
