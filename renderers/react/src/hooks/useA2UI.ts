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

import { useCallback } from "react";
import { Types } from "@a2ui/lit/0.8";
import { useA2UIContext } from "../context/A2UIContext.js";
import type { A2UIActionEvent } from "../types/index.js";

export interface UseA2UIReturn {
  /** Map of all surfaces */
  surfaces: ReadonlyMap<string, Types.Surface>;
  /** Get a specific surface by ID */
  getSurface: (surfaceId: string) => Types.Surface | undefined;
  /** Process incoming A2UI messages from the server */
  processMessages: (messages: Types.ServerToClientMessage[]) => void;
  /** Send an action event to the server */
  sendAction: (action: A2UIActionEvent) => void;
  /** Get the root component tree for a surface */
  getComponentTree: (surfaceId: string) => Types.AnyComponentNode | null;
  /** Clear all surfaces */
  clearSurfaces: () => void;
}

/**
 * Main hook for interacting with A2UI.
 * Provides access to surfaces, message processing, and action sending.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { surfaces, processMessages, sendAction } = useA2UI();
 *
 *   // Process messages from server
 *   useEffect(() => {
 *     fetch('/api/a2ui').then(res => res.json()).then(processMessages);
 *   }, []);
 *
 *   // Render surfaces
 *   return <A2UIRenderer surfaceId="main" />;
 * }
 * ```
 */
export function useA2UI(): UseA2UIReturn {
  const { processor, surfaces, processMessages, sendAction, refresh } =
    useA2UIContext();

  const getSurface = useCallback(
    (surfaceId: string) => {
      return surfaces.get(surfaceId);
    },
    [surfaces]
  );

  const getComponentTree = useCallback(
    (surfaceId: string) => {
      const surface = surfaces.get(surfaceId);
      return surface?.componentTree ?? null;
    },
    [surfaces]
  );

  const clearSurfaces = useCallback(() => {
    processor.clearSurfaces();
    refresh();
  }, [processor, refresh]);

  return {
    surfaces,
    getSurface,
    processMessages,
    sendAction,
    getComponentTree,
    clearSurfaces,
  };
}
