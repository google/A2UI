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

import { useState, useCallback } from "react";
import { useA2UI } from "@a2ui/react";
import { Types } from "@a2ui/lit/0.8";

// Type for A2A server response parts
// Note: Python SDK wraps parts in a `root` property, JS SDK does not
interface A2AServerPayloadPart {
  kind?: "text" | "data";
  text?: string;
  data?: Types.ServerToClientMessage;
  root?: {
    kind: "text" | "data";
    text?: string;
    data?: Types.ServerToClientMessage;
  };
}

type A2AServerPayload = A2AServerPayloadPart[] | { error: string };

/**
 * Converts a plain text string to A2UI messages that can be rendered.
 * Creates a simple surface with a Text component displaying the text.
 */
function textToA2UIMessages(text: string, surfaceId: string = "text-surface"): Types.ServerToClientMessage[] {
  return [
    {
      surfaceUpdate: {
        surfaceId,
        components: [
          {
            id: "root",
            component: {
              Column: {
                children: { explicitList: ["text-content"] },
              },
            },
          },
          {
            id: "text-content",
            component: {
              Text: {
                text: { literalString: text },
              },
            },
          },
        ],
      },
    },
    {
      dataModelUpdate: {
        surfaceId,
        contents: [],
      },
    },
    {
      beginRendering: {
        surfaceId,
        root: "root",
      },
    },
  ];
}

/**
 * Custom hook for A2A client communication.
 * Mirrors the Angular Client service pattern.
 */
export function useClient() {
  const { surfaces, processMessages, clearSurfaces, sendAction } = useA2UI();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Send a message to the A2A backend and process the response.
   */
  const makeRequest = useCallback(
    async (message: string | Types.A2UIClientEventMessage) => {
      let messages: Types.ServerToClientMessage[];

      try {
        setIsLoading(true);
        messages = await send(message);
      } catch (err) {
        console.error(err);
        throw err;
      } finally {
        setIsLoading(false);
      }

      clearSurfaces();
      processMessages(messages);
      return messages;
    },
    [processMessages, clearSurfaces]
  );

  /**
   * Low-level send function to communicate with the A2A endpoint.
   */
  const send = async (
    message: string | Types.A2UIClientEventMessage
  ): Promise<Types.ServerToClientMessage[]> => {
    const body = typeof message === "string" ? message : JSON.stringify(message);

    const response = await fetch("/a2a", {
      method: "POST",
      body,
    });

    if (response.ok) {
      const data = (await response.json()) as A2AServerPayload;
      const messages: Types.ServerToClientMessage[] = [];
      const textParts: string[] = [];

      if ("error" in data) {
        throw new Error(data.error);
      } else {
        for (const item of data) {
          // Handle both Python SDK (with root wrapper) and JS SDK (direct) formats
          const part = item.root || item;
          if (part.kind === "text" && part.text) {
            // Collect text parts to display if no A2UI data parts are found
            textParts.push(part.text);
          } else if (part.kind === "data" && part.data) {
            messages.push(part.data);
          }
        }
      }

      // If no A2UI data parts were found but we have text parts,
      // convert the text to A2UI messages so they can be rendered
      if (messages.length === 0 && textParts.length > 0) {
        const combinedText = textParts.join("\n\n");
        return textToA2UIMessages(combinedText);
      }

      return messages;
    }

    const error = (await response.json()) as { error: string };
    throw new Error(error.error);
  };

  return {
    surfaces,
    isLoading,
    makeRequest,
    sendAction,
  };
}
