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

import * as Primitives from '@a2ui/web_core/types/primitives';
import * as Types from '@a2ui/web_core/types/types';
import { useA2UIConfig } from '../config';
import { useMessageProcessor } from '../data/processor';

let idCounter = 0;

export function useDynamicComponent<T extends Types.AnyComponentNode = Types.AnyComponentNode>(props: {
  surfaceId: Types.SurfaceID | null;
  component: T;
  weight: string | number;
}) {
  const { theme } = useA2UIConfig();
  const processor = useMessageProcessor();

  function sendAction(action: Types.Action): Promise<Types.ServerToClientMessage[]> {
    const component = props.component;
    const surfaceId = props.surfaceId ?? undefined;
    const context: Record<string, unknown> = {};

    if (action.context) {
      for (const item of action.context) {
        if (item.value.literalBoolean !== undefined) {
          context[item.key] = item.value.literalBoolean;
        } else if (item.value.literalNumber !== undefined) {
          context[item.key] = item.value.literalNumber;
        } else if (item.value.literalString !== undefined) {
          context[item.key] = item.value.literalString;
        } else if (item.value.path) {
          const path = processor.resolvePath(item.value.path, component.dataContextPath);
          const value = processor.getData(component, path, surfaceId);
          context[item.key] = value;
        }
      }
    }

    const message: Types.A2UIClientEventMessage = {
      userAction: {
        name: action.name,
        sourceComponentId: component.id,
        surfaceId: surfaceId!,
        timestamp: new Date().toISOString(),
        context,
      },
    };

    return processor.dispatch(message);
  }

  function resolvePrimitive(value: Primitives.StringValue | null): string | null;
  function resolvePrimitive(value: Primitives.BooleanValue | null): boolean | null;
  function resolvePrimitive(value: Primitives.NumberValue | null): number | null;
  function resolvePrimitive(
    value: Primitives.StringValue | Primitives.BooleanValue | Primitives.NumberValue | null,
  ): string | boolean | number | null {
    const component = props.component;
    const surfaceId = props.surfaceId;

    if (!value || typeof value !== 'object') {
      return null;
    } else if ((value as any).literal != null) {
      return (value as any).literal;
    } else if ((value as any).path) {
      return processor.getData(component, (value as any).path, surfaceId ?? undefined) as any;
    } else if ('literalString' in value) {
      return value.literalString ?? null;
    } else if ('literalNumber' in value) {
      return value.literalNumber ?? null;
    } else if ('literalBoolean' in value) {
      return value.literalBoolean ?? null;
    }

    return null;
  }

  function getUniqueId(prefix: string): string {
    return `${prefix}-${idCounter++}`;
  }

  function setData(
    node: Types.AnyComponentNode,
    relativePath: string,
    value: Types.DataValue,
    surfaceId?: Types.SurfaceID | null,
  ) {
    processor.setData(node, relativePath, value, surfaceId);
  }

  return {
    theme,
    processor,
    sendAction,
    resolvePrimitive,
    getUniqueId,
    setData,
  };
}
