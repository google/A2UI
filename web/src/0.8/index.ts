/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
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
