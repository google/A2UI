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

import { Types } from "@a2ui/lit/0.8";

export type MessageProcessor = Types.MessageProcessor;
export type Theme = Types.Theme;
export type Surface = Types.Surface;
export type AnyComponentNode = Types.AnyComponentNode;
export type ServerToClientMessage = Types.ServerToClientMessage;
export type DataValue = Types.DataValue;

export interface A2UIComponentProps {
  node: Types.AnyComponentNode;
  surfaceId: string;
}

export interface A2UIActionEvent {
  type: "a2ui.action";
  actionId: string;
  context: Record<string, unknown>;
}

export type SendActionCallback = (action: A2UIActionEvent) => void;
