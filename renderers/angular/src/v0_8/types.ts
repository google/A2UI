/*
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  Action as WebCoreAction,
  ServerToClientMessage as WebCoreServerToClientMessage,
  ButtonNode,
  TextNode,
  ImageNode,
  IconNode,
  AudioPlayerNode,
  VideoNode,
  CardNode,
  DividerNode,
  RowNode,
  ColumnNode,
  ListNode,
  TextFieldNode,
  CheckboxNode,
  SliderNode,
  MultipleChoiceNode,
  DateTimeInputNode,
  ModalNode,
  TabsNode,
} from '@a2ui/web_core/v0_8';

export namespace Types {
  export type Action = WebCoreAction;
  export type FunctionCall = any; // v0.8 might not have FunctionCall or structure differs
  export type SurfaceID = string;

  export interface ClientToServerMessage {
    action: Action;
    version: string;
    surfaceId?: string;
  }
  export type A2UIClientEventMessage = ClientToServerMessage;

  export interface Component<P = Record<string, any>> {
    id: string;
    type: string;
    properties: P;
    [key: string]: any;
  }

  export type AnyComponentNode = Component<any>;
  export type CustomNode = AnyComponentNode;

  export type ServerToClientMessage = WebCoreServerToClientMessage;

  export interface Theme {
    components?: any;
    additionalStyles?: any;
    [key: string]: any;
  }

  // Aliases
  export type Row = RowNode;
  export type Column = ColumnNode;
  export type Text = TextNode;
  export type List = ListNode;
  export type Image = ImageNode;
  export type Icon = IconNode;
  export type Video = VideoNode;
  export type Audio = AudioPlayerNode;
  export type Button = ButtonNode;
  export type Divider = DividerNode;
  export type MultipleChoice = MultipleChoiceNode;
  export type TextField = TextFieldNode;
  export type Checkbox = CheckboxNode;
  export type Slider = SliderNode;
  export type DateTimeInput = DateTimeInputNode;
  export type Tabs = TabsNode;
  export type Modal = ModalNode;

  // Explicit Node exports
  export type RowNode = import('@a2ui/web_core/v0_8').RowNode;
  export type ColumnNode = import('@a2ui/web_core/v0_8').ColumnNode;
  export type TextNode = import('@a2ui/web_core/v0_8').TextNode;
  export type ListNode = import('@a2ui/web_core/v0_8').ListNode;
  export type ImageNode = import('@a2ui/web_core/v0_8').ImageNode;
  export type IconNode = import('@a2ui/web_core/v0_8').IconNode;
  export type VideoNode = import('@a2ui/web_core/v0_8').VideoNode;
  export type AudioPlayerNode = import('@a2ui/web_core/v0_8').AudioPlayerNode;
  export type ButtonNode = import('@a2ui/web_core/v0_8').ButtonNode;
  export type DividerNode = import('@a2ui/web_core/v0_8').DividerNode;
  export type MultipleChoiceNode = import('@a2ui/web_core/v0_8').MultipleChoiceNode;
  export type TextFieldNode = import('@a2ui/web_core/v0_8').TextFieldNode;
  export type CheckboxNode = import('@a2ui/web_core/v0_8').CheckboxNode;
  export type SliderNode = import('@a2ui/web_core/v0_8').SliderNode;
  export type DateTimeInputNode = import('@a2ui/web_core/v0_8').DateTimeInputNode;
  export type TabsNode = import('@a2ui/web_core/v0_8').TabsNode;
  export type ModalNode = import('@a2ui/web_core/v0_8').ModalNode;

  export type CardNode = import('@a2ui/web_core/v0_8').CardNode;
}
