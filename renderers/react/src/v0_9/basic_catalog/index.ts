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

import {Catalog} from '@a2ui/web_core/v0_9';
import {BASIC_FUNCTIONS} from '@a2ui/web_core/v0_9/basic_catalog';
import type {ReactComponentImplementation} from '../adapter';

import {ReactText} from './components/ReactText';
import {ReactImage} from './components/ReactImage';
import {ReactIcon} from './components/ReactIcon';
import {ReactVideo} from './components/ReactVideo';
import {ReactAudioPlayer} from './components/ReactAudioPlayer';
import {ReactRow} from './components/ReactRow';
import {ReactColumn} from './components/ReactColumn';
import {ReactList} from './components/ReactList';
import {ReactCard} from './components/ReactCard';
import {ReactTabs} from './components/ReactTabs';
import {ReactDivider} from './components/ReactDivider';
import {ReactModal} from './components/ReactModal';
import {ReactButton} from './components/ReactButton';
import {ReactTextField} from './components/ReactTextField';
import {ReactCheckBox} from './components/ReactCheckBox';
import {ReactChoicePicker} from './components/ReactChoicePicker';
import {ReactSlider} from './components/ReactSlider';
import {ReactDateTimeInput} from './components/ReactDateTimeInput';

const basicComponents: ReactComponentImplementation[] = [
  ReactText,
  ReactImage,
  ReactIcon,
  ReactVideo,
  ReactAudioPlayer,
  ReactRow,
  ReactColumn,
  ReactList,
  ReactCard,
  ReactTabs,
  ReactDivider,
  ReactModal,
  ReactButton,
  ReactTextField,
  ReactCheckBox,
  ReactChoicePicker,
  ReactSlider,
  ReactDateTimeInput,
];

export const basicCatalog = new Catalog<ReactComponentImplementation>(
  'https://a2ui.org/specification/v0_9/basic_catalog.json',
  basicComponents,
  BASIC_FUNCTIONS
);

export {
  ReactText,
  ReactImage,
  ReactIcon,
  ReactVideo,
  ReactAudioPlayer,
  ReactRow,
  ReactColumn,
  ReactList,
  ReactCard,
  ReactTabs,
  ReactDivider,
  ReactModal,
  ReactButton,
  ReactTextField,
  ReactCheckBox,
  ReactChoicePicker,
  ReactSlider,
  ReactDateTimeInput,
};
