/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { BeginRenderingMessage } from "../types/begin-rendering";
import { ComponentUpdateMessage } from "../types/component-update";
import { DataModelUpdateMessage } from "../types/data-update";
import { StreamHeaderMessage } from "../types/stream-header";

export function isStreamHeader(msg: unknown): msg is StreamHeaderMessage {
  return "version" in (msg as StreamHeaderMessage);
}

export function isBeginRendering(msg: unknown): msg is BeginRenderingMessage {
  return "root" in (msg as BeginRenderingMessage);
}

export function isComponentUpdate(msg: unknown): msg is ComponentUpdateMessage {
  return "components" in (msg as ComponentUpdateMessage);
}

export function isDataModelUpdate(msg: unknown): msg is DataModelUpdateMessage {
  return "contents" in (msg as DataModelUpdateMessage);
}
