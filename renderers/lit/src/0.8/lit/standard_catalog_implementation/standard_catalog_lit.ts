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

import { CatalogImplementation } from '../../core/types/types';
import { standardCatalogApi } from '../../core/standard_catalog_api/standard_catalog.js';
import { litAudioPlayerRenderer } from './audio_player';
import { litButtonRenderer } from './button';
import { litCardRenderer } from './card';
import { litCheckboxRenderer } from './checkbox';
import { litColumnRenderer } from './column';
import { litDateTimeInputRenderer } from './datetime_input';
import { litDividerRenderer } from './divider';
import { litIconRenderer } from './icon';
import { litImageRenderer } from './image';
import { litListRenderer } from './list';
import { litModalRenderer } from './modal';
import { litMultipleChoiceRenderer } from './multiple_choice';
import { litRowRenderer } from './row';
import { litSliderRenderer } from './slider';
import { litTabsRenderer } from './tabs';
import { litTextFieldRenderer } from './text_field';
import { litTextRenderer } from './text';
import { litVideoRenderer } from './video';

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
