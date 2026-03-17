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

import { Injectable, inject } from '@angular/core';
import { Catalog } from '../rendering/catalog';

// Components
import { AudioPlayer } from '../components/audio';
import { Button } from '../components/button';
import { Card } from '../components/card';
import { Checkbox } from '../components/checkbox';
import { Column } from '../components/column';
import { DateTimeInput } from '../components/datetime-input';
import { Divider } from '../components/divider';
import { Icon } from '../components/icon';
import { Image } from '../components/image';
import { List } from '../components/list';
import { Modal } from '../components/modal';
import { MultipleChoice } from '../components/multiple-choice';
import { Row } from '../components/row';
import { Slider } from '../components/slider';
import { Tabs } from '../components/tabs';
import { Text } from '../components/text';
import { TextField } from '../components/text-field';
import { Video } from '../components/video';

export function registerStandardComponents(catalog: Catalog) {
  catalog.registerComponent('AudioPlayer', AudioPlayer);
  catalog.registerComponent('Button', Button);
  catalog.registerComponent('Card', Card);
  catalog.registerComponent('CheckBox', Checkbox);
  catalog.registerComponent('Column', Column);
  catalog.registerComponent('DateTimeInput', DateTimeInput);
  catalog.registerComponent('Divider', Divider);
  catalog.registerComponent('Icon', Icon);
  catalog.registerComponent('Image', Image);
  catalog.registerComponent('List', List);
  catalog.registerComponent('Modal', Modal);
  catalog.registerComponent('MultipleChoice', MultipleChoice);
  catalog.registerComponent('Row', Row);
  catalog.registerComponent('Slider', Slider);
  catalog.registerComponent('Tabs', Tabs);
  catalog.registerComponent('Text', Text);
  catalog.registerComponent('TextField', TextField);
  catalog.registerComponent('Video', Video);
}

export const DEFAULT_CATALOG = new Catalog();
registerStandardComponents(DEFAULT_CATALOG);

@Injectable({
  providedIn: 'root',
})
export class StandardCatalog {
  private readonly catalog = inject(Catalog);

  register() {
    registerStandardComponents(this.catalog);
  }
}
