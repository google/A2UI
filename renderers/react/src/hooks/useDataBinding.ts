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
import { Types, Primitives } from "@a2ui/lit/0.8";
import { useA2UIContext } from "../context/A2UIContext.js";

export function useDataBinding(
  node: Types.AnyComponentNode,
  surfaceId: string
) {
  const { processor, refresh } = useA2UIContext();

  const resolveString = useCallback(
    (value: Primitives.StringValue | null | undefined): string | null => {
      if (!value) return null;

      if (value.literalString !== undefined) {
        if (value.path) {
          processor.setData(node, value.path, value.literalString, surfaceId);
        }
        return value.literalString;
      }

      if (value.path) {
        const data = processor.getData(node, value.path, surfaceId);
        return data !== null ? String(data) : null;
      }

      return null;
    },
    [processor, node, surfaceId]
  );

  const resolveNumber = useCallback(
    (value: Primitives.NumberValue | null | undefined): number | null => {
      if (!value) return null;

      if (value.literalNumber !== undefined) {
        if (value.path) {
          processor.setData(node, value.path, value.literalNumber, surfaceId);
        }
        return value.literalNumber;
      }

      if (value.path) {
        const data = processor.getData(node, value.path, surfaceId);
        return data !== null ? Number(data) : null;
      }

      return null;
    },
    [processor, node, surfaceId]
  );

  const resolveBoolean = useCallback(
    (value: Primitives.BooleanValue | null | undefined): boolean | null => {
      if (!value) return null;

      if (value.literalBoolean !== undefined) {
        if (value.path) {
          processor.setData(node, value.path, value.literalBoolean, surfaceId);
        }
        return value.literalBoolean;
      }

      if (value.path) {
        const data = processor.getData(node, value.path, surfaceId);
        return data !== null ? Boolean(data) : null;
      }

      return null;
    },
    [processor, node, surfaceId]
  );

  const setValue = useCallback(
    (path: string, value: Types.DataValue) => {
      processor.setData(node, path, value, surfaceId);
      refresh();
    },
    [processor, node, surfaceId, refresh]
  );

  const getValue = useCallback(
    (path: string): Types.DataValue | null => {
      return processor.getData(node, path, surfaceId);
    },
    [processor, node, surfaceId]
  );

  return {
    resolveString,
    resolveNumber,
    resolveBoolean,
    setValue,
    getValue,
  };
}
