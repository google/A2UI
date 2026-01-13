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

import { CatalogItem } from '../catalog/catalog_item.js';
import { audioPlayerCatalogItem } from './audio_player.js';
import { buttonCatalogItem } from './button.js';
import { cardCatalogItem } from './card.js';
import { checkBoxCatalogItem } from './checkbox.js';
import { columnCatalogItem } from './column.js';
import { dateTimeInputCatalogItem } from './date_time_input.js';
import { dividerCatalogItem } from './divider.js';
import { iconCatalogItem } from './icon.js';
import { imageCatalogItem } from './image.js';
import { listCatalogItem } from './list.js';
import { modalCatalogItem } from './modal.js';
import { multipleChoiceCatalogItem } from './multiple_choice.js';
import { rowCatalogItem } from './row.js';
import { sliderCatalogItem } from './slider.js';
import { tabsCatalogItem } from './tabs.js';
import { textFieldCatalogItem } from './text_field.js';
import { textCatalogItem } from './text.js';
import { videoCatalogItem } from './video.js';

/**
 * Provides the collection of standard CatalogItems for A2UI.
 */
export class StandardCatalogItems {
  /**
   * An immutable list of all standard catalog items.
   */
  static readonly items: readonly CatalogItem[] = Object.freeze([
    audioPlayerCatalogItem,
    buttonCatalogItem,
    cardCatalogItem,
    checkBoxCatalogItem,
    columnCatalogItem,
    dateTimeInputCatalogItem,
    dividerCatalogItem,
    iconCatalogItem,
    imageCatalogItem,
    listCatalogItem,
    modalCatalogItem,
    multipleChoiceCatalogItem,
    rowCatalogItem,
    sliderCatalogItem,
    tabsCatalogItem,
    textFieldCatalogItem,
    textCatalogItem,
    videoCatalogItem,
  ]);
}
