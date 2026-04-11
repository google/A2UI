/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useMemo } from 'react';

export interface V09Component {
  id: string;
  component: string;
  [key: string]: unknown;
}

export interface A2UISurfaceState {
  root: string;
  components: V09Component[];
  data: Record<string, unknown>;
  theme: Record<string, unknown>;
}

/**
 * Transform a stream of v0.9 A2UI messages into
 * the v0.9 component format that V09Viewer expects.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- A2UI messages are untyped JSONL
export function useA2UISurface(messages: Record<string, any>[]): A2UISurfaceState {
  return useMemo(() => {
    let root = "root";
    const componentsMap = new Map<string, V09Component>();
    let data: Record<string, unknown> = {};
    let theme: Record<string, unknown> = {};

    for (const msg of messages) {
      if (!msg) continue;

      // --- v0.9 messages ---
      if (msg.createSurface) {
        // v0.9 spec: root is always the component with id "root", not a message property
        root = "root";
        if (msg.createSurface.theme && typeof msg.createSurface.theme === 'object') {
          theme = { ...msg.createSurface.theme };
        }
      }
      if (msg.updateComponents) {
        for (const comp of msg.updateComponents.components || []) {
          if (comp.id) {
            componentsMap.set(comp.id, comp);
          }
        }
      }
      if (msg.updateDataModel) {
        const op = msg.updateDataModel.op || 'replace';
        const path = msg.updateDataModel.path || '/';
        const value = msg.updateDataModel.value ?? msg.updateDataModel.contents;

        if (op === 'remove') {
          if (path === '/') {
            data = {};
          } else {
            const segments = path.replace(/^\//, '').split('/');
            deleteAtPath(data, segments);
          }
        } else if (value !== undefined) {
          if (path === '/') {
            if (typeof value === 'object' && !Array.isArray(value)) {
              const valObj = value as Record<string, unknown>;
              data = op === 'replace' ? { ...valObj } : { ...data, ...valObj };
            }
          } else {
            const segments = path.replace(/^\//, '').split('/');
            setAtPath(data, segments, value);
          }
        }
      }
      if (msg.deleteSurface) {
        // Clear all state when surface is deleted
        componentsMap.clear();
        data = {};
        root = "root";
      }
    }

    return {
      root,
      components: Array.from(componentsMap.values()),
      data,
      theme,
    };
  }, [messages]);
}

/**
 * Set a value at a JSON Pointer path within an object.
 */
function setAtPath(obj: Record<string, unknown>, segments: string[], value: unknown): void {
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < segments.length - 1; i++) {
    const key = segments[i]!;
    if (current[key] === undefined || typeof current[key] !== 'object') {
      const nextKey = segments[i + 1];
      current[key] = /^\d+$/.test(nextKey ?? '') ? [] : {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[segments[segments.length - 1]!] = value;
}

/**
 * Delete a value at a JSON Pointer path within an object.
 */
function deleteAtPath(obj: Record<string, unknown>, segments: string[]): void {
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < segments.length - 1; i++) {
    const key = segments[i]!;
    if (current[key] === undefined || typeof current[key] !== 'object') {
      return;
    }
    current = current[key] as Record<string, unknown>;
  }
  delete current[segments[segments.length - 1]!];
}
