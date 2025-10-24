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

import { Binding, InjectionToken, Type } from '@angular/core';
import { DynamicComponent } from './dynamic-component';
import { v0_8 } from '@a2ui/web-lib';

export type CatalogLoader = () =>
  | Promise<Type<DynamicComponent<any>>>
  | Type<DynamicComponent<any>>;

export type CatalogEntry<T extends v0_8.Types.AnyComponentNode> =
  | CatalogLoader
  | {
      type: CatalogLoader;
      bindings: (data: T) => Binding[];
    };

export interface Catalog {
  Button?: CatalogEntry<v0_8.Types.ButtonNode>;
  Heading?: CatalogEntry<v0_8.Types.HeadingNode>;
  Text?: CatalogEntry<v0_8.Types.TextNode>;
  Image?: CatalogEntry<v0_8.Types.ImageNode>;
  Video?: CatalogEntry<v0_8.Types.VideoNode>;
  AudioPlayer?: CatalogEntry<v0_8.Types.AudioPlayerNode>;
  Row?: CatalogEntry<v0_8.Types.RowNode>;
  Column?: CatalogEntry<v0_8.Types.ColumnNode>;
  List?: CatalogEntry<v0_8.Types.ListNode>;
  Card?: CatalogEntry<v0_8.Types.CardNode>;
  Tabs?: CatalogEntry<v0_8.Types.TabsNode>;
  Divider?: CatalogEntry<v0_8.Types.DividerNode>;
  Modal?: CatalogEntry<v0_8.Types.ModalNode>;
  CheckBox?: CatalogEntry<v0_8.Types.CheckboxNode>;
  TextField?: CatalogEntry<v0_8.Types.TextFieldNode>;
  DateTimeInput?: CatalogEntry<v0_8.Types.DateTimeInputNode>;
  MultipleChoice?: CatalogEntry<v0_8.Types.MultipleChoiceNode>;
  Slider?: CatalogEntry<v0_8.Types.SliderNode>;
}

export const Catalog = new InjectionToken<Catalog>('Catalog');
