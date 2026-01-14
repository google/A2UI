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

import { CatalogImplementation } from '../../core/types/types.js';
import { standardCatalogApi } from '../../core/standard_catalog_api/standard_catalog.js';
import { litAudioPlayerRenderer } from './audio_player.js';
import { litButtonRenderer } from './button.js';
import { litCardRenderer } from './card.js';
import { litCheckboxRenderer } from './checkbox.js';
import { litColumnRenderer } from './column.js';
import { litDateTimeInputRenderer } from './datetime_input.js';
import { litDividerRenderer } from './divider.js';
import { litIconRenderer } from './icon.js';
import { litImageRenderer } from './image.js';
import { litListRenderer } from './list.js';
import { litModalRenderer } from './modal.js';
import { litMultipleChoiceRenderer } from './multiple_choice.js';
import { litRowRenderer } from './row.js';
import { litSliderRenderer } from './slider.js';
import { litTabsRenderer } from './tabs.js';
import { litTextFieldRenderer } from './text_field.js';
import { litTextRenderer } from './text.js';
import { litVideoRenderer } from './video.js';

export const standardLitCatalogImplementation = new CatalogImplementation(
  standardCatalogApi,
  [
    litAudioPlayerRenderer,
    litButtonRenderer,
    litCardRenderer,
    litCheckboxRenderer,
    litColumnRenderer,
    litDateTimeInputRenderer,
    litDividerRenderer,
    litIconRenderer,
    litImageRenderer,
    litListRenderer,
    litModalRenderer,
    litMultipleChoiceRenderer,
    litRowRenderer,
    litSliderRenderer,
    litTabsRenderer,
    litTextFieldRenderer,
    litTextRenderer,
    litVideoRenderer,
  ]
);
