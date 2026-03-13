/*
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export * from "./catalog/types.js";
export * from "./common/events.js";
export * from "./processing/message-processor.js";
export * from "./rendering/component-context.js";
export * from "./rendering/data-context.js";
export * from "./rendering/generic-binder.js";
export * from "./schema/index.js";
export * from "./state/component-model.js";
export * from "./state/data-model.js";
export * from "./state/surface-components-model.js";
export * from "./state/surface-group-model.js";
export * from "./state/surface-model.js";
export * from "./errors.js";

import A2uiMessageSchemaRaw from "./schemas/server_to_client.json" with { type: "json" };

export const Schemas = {
  A2uiMessageSchemaRaw,
};
