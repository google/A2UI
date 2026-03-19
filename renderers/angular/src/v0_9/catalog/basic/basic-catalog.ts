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
  BASIC_FUNCTIONS,
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
} from '@a2ui/web_core/v0_9/basic_catalog';
import { FunctionImplementation } from '@a2ui/web_core/v0_9';

/**
 * The set of Angular UI components provided by the basic catalog.
 */
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

/**
 * The set of client-side functions provided by the basic catalog.
 */
export { BASIC_FUNCTIONS };



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
 *
 * This catalog includes a wide range of UI components (Text, Button, Row, etc.)
 * and utility functions (capitalize, formatString) defined in the A2UI v0.9
 * basic catalog specification.
 */
@Injectable({
  providedIn: 'root',
})
export class BasicCatalog extends BaseBasicCatalog {
  constructor() {
    super();
  }
}
