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

import { CatalogApi } from '../types/types';
import { audioPlayerApi } from './audio_player';
import { buttonApi } from './button';
import { cardApi } from './card';
import { checkboxApi } from './checkbox';
import { columnApi } from './column';
import { dateTimeInputApi } from './datetime_input';
import { dividerApi } from './divider';
import { iconApi } from './icon';
import { imageApi } from './image';
import { listApi } from './list';
import { modalApi } from './modal';
import { multipleChoiceApi } from './multiple_choice';
import { rowApi } from './row';
import { sliderApi } from './slider';
import { tabsApi } from './tabs';
import { textFieldApi } from './text_field';
import { textApi } from './text';
import { videoApi } from './video';

export const standardCatalogApi = new CatalogApi([
  audioPlayerApi,
  buttonApi,
  cardApi,
  checkboxApi,
  columnApi,
  dateTimeInputApi,
  dividerApi,
  iconApi,
  imageApi,
  listApi,
  modalApi,
  multipleChoiceApi,
  rowApi,
  sliderApi,
  tabsApi,
  textFieldApi,
  textApi,
  videoApi,
]);
