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

import { CatalogApi } from '../types/types.js';
import { audioPlayerApi } from './audio_player.js';
import { buttonApi } from './button.js';
import { cardApi } from './card.js';
import { checkboxApi } from './checkbox.js';
import { columnApi } from './column.js';
import { dateTimeInputApi } from './datetime_input.js';
import { dividerApi } from './divider.js';
import { iconApi } from './icon.js';
import { imageApi } from './image.js';
import { listApi } from './list.js';
import { modalApi } from './modal.js';
import { multipleChoiceApi } from './multiple_choice.js';
import { rowApi } from './row.js';
import { sliderApi } from './slider.js';
import { tabsApi } from './tabs.js';
import { textFieldApi } from './text_field.js';
import { textApi } from './text.js';
import { videoApi } from './video.js';

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
