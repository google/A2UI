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

export * as Events from "./events/events";
export * as Types from "./types/types.js";
export * as Data from "./data/model-processor.js";

import A2UIProtocol from "./schemas/a2ui-message.json";
import ClientEvent from "./schemas/client-event.json";
import Catalog from "./catalog/default-catalog.json";

import * as GeminiMiddleware from "./middleware/gemini.js";
import * as ImageFallbackMiddleware from "./middleware/image-fallback.js";
import * as A2AMiddleware from "./middleware/a2a.js";

export const Middleware = {
  GeminiMiddleware,
  ImageFallbackMiddleware,
  A2AMiddleware,
};

export const Schemas = {
  DefaultCatalog: Catalog,
  A2UIProtocol,
  ClientEvent,
};
