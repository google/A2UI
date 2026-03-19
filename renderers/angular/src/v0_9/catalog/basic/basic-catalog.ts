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

import { Injectable } from '@angular/core';
import { z } from 'zod';
import { createFunctionImplementation } from '@a2ui/web_core/v0_9';
import { AngularCatalog, AngularComponentImplementation } from '../types';
import { TextComponent } from './text.component';
import { RowComponent } from './row.component';
import { ColumnComponent } from './column.component';
import { ButtonComponent } from './button.component';
import { TextFieldComponent } from './text-field.component';
import { ImageComponent } from './image.component';
import { IconComponent } from './icon.component';
import { VideoComponent } from './video.component';
import { AudioPlayerComponent } from './audio-player.component';
import { ListComponent } from './list.component';
import { CardComponent } from './card.component';
import { TabsComponent } from './tabs.component';
import { ModalComponent } from './modal.component';
import { DividerComponent } from './divider.component';
import { CheckBoxComponent } from './check-box.component';
import { ChoicePickerComponent } from './choice-picker.component';
import { SliderComponent } from './slider.component';
import { DateTimeInputComponent } from './date-time-input.component';

import {
  TextApi,
  RowApi,
  ColumnApi,
  ButtonApi,
  TextFieldApi,
  ImageApi,
  IconApi,
  VideoApi,
  AudioPlayerApi,
  ListApi,
  CardApi,
  TabsApi,
  ModalApi,
  DividerApi,
  CheckBoxApi,
  ChoicePickerApi,
  SliderApi,
  DateTimeInputApi,
  FormatStringImplementation,
} from '@a2ui/web_core/v0_9/basic_catalog';
import { FunctionImplementation } from '@a2ui/web_core/v0_9';

export const BASIC_COMPONENTS: AngularComponentImplementation[] = [
  { ...TextApi, component: TextComponent },
  { ...RowApi, component: RowComponent },
  { ...ColumnApi, component: ColumnComponent },
  { ...ButtonApi, component: ButtonComponent },
  { ...TextFieldApi, component: TextFieldComponent },
  { ...ImageApi, component: ImageComponent },
  { ...IconApi, component: IconComponent },
  { ...VideoApi, component: VideoComponent },
  { ...AudioPlayerApi, component: AudioPlayerComponent },
  { ...ListApi, component: ListComponent },
  { ...CardApi, component: CardComponent },
  { ...TabsApi, component: TabsComponent },
  { ...ModalApi, component: ModalComponent },
  { ...DividerApi, component: DividerComponent },
  { ...CheckBoxApi, component: CheckBoxComponent },
  { ...ChoicePickerApi, component: ChoicePickerComponent },
  { ...SliderApi, component: SliderComponent },
  { ...DateTimeInputApi, component: DateTimeInputComponent },
];

export const BASIC_FUNCTIONS: FunctionImplementation[] = [
  createFunctionImplementation(
    {
      name: 'capitalize',
      returnType: 'string',
      schema: z.object({ value: z.string().optional() }),
    },
    (args) => {
      console.log('[BasicCatalog] capitalize called with args:', args);
      const value = String(args.value || '');
      const res = value.charAt(0).toUpperCase() + value.slice(1);
      console.log('[BasicCatalog] capitalize result:', res);
      return res;
    },
  ),
  FormatStringImplementation,
];

/**
 * A base class for basic catalogs, providing extensibility for non-DI use cases.
 */
export class BaseBasicCatalog extends AngularCatalog {
  constructor(
    id: string = 'https://a2ui.org/specification/v0_9/basic_catalog.json',
    components: AngularComponentImplementation[] = BASIC_COMPONENTS,
    functions: FunctionImplementation[] = BASIC_FUNCTIONS,
  ) {
    super(id, components, functions);
  }
}

/**
 * A basic catalog of components and functions for v0.9 verification.
 */
@Injectable({
  providedIn: 'root',
})
export class BasicCatalog extends BaseBasicCatalog {
  constructor() {
    super();
  }
}
