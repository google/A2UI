/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export * as UI from "./0.7/ui/ui";
export * as Data from "./0.7/data/model";
export * as Events from "./0.7/events/events";
export * as Types from "./0.7/types/types";

import streamHeader from "./0.7/schemas/stream-header.json";
import beginRendering from "./0.7/schemas/begin-rendering.json";
import componentUpdate from "./0.7/schemas/component-update.json";
import dataModelUpdate from "./0.7/schemas/data-model-update.json";

export const Schemas = {
  streamHeader,
  beginRendering,
  componentUpdate,
  dataModelUpdate,
};
