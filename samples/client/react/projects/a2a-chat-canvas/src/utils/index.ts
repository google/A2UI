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

import { Part, SendMessageSuccessResponse, Task } from "@a2a-js/sdk";
import { Types } from "@a2ui/lit/0.8";
import { UiMessageContent } from "../types";
import { v4 as uuid } from "uuid";

/**
 * Extracts A2A parts from a SendMessageSuccessResponse.
 */
export function extractA2aPartsFromResponse(
  response: SendMessageSuccessResponse
): Part[] {
  const result = response.result as Task;
  if (result.kind !== "task" || !result.status.message?.parts) {
    return [];
  }
  return result.status.message.parts;
}

/**
 * Extracts A2UI data parts from A2A response parts.
 */
export function extractA2uiDataParts(parts: Part[]): Types.ServerToClientMessage[] {
  const a2uiParts: Types.ServerToClientMessage[] = [];

  for (const part of parts) {
    if (part.kind === "data" && isA2uiDataPart(part)) {
      a2uiParts.push(part.data as Types.ServerToClientMessage);
    }
  }

  return a2uiParts;
}

/**
 * Checks if a part is an A2UI data part.
 */
export function isA2uiDataPart(part: Part): boolean {
  return (
    part.kind === "data" &&
    part.metadata?.mimeType === "application/json+a2ui"
  );
}

/**
 * Converts a Part to UiMessageContent.
 */
export function convertPartToUiMessageContent(part: Part): UiMessageContent {
  let variant = "default_text_part";

  if (part.kind === "data" && isA2uiDataPart(part)) {
    variant = "a2ui_data_part";
  }

  return {
    type: "ui_message_content",
    id: uuid(),
    data: part,
    variant,
  };
}

/**
 * Formats a timestamp for display.
 */
export function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}
