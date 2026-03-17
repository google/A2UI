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

@Injectable({
  providedIn: 'root',
})
export class StandardCatalog {
  private readonly catalog = inject(Catalog);

  register() {
    this.catalog.registerComponent('AudioPlayer', AudioPlayer);
    this.catalog.registerComponent('Button', Button);
    this.catalog.registerComponent('Card', Card);
    this.catalog.registerComponent('CheckBox', Checkbox);
    this.catalog.registerComponent('Column', Column);
    this.catalog.registerComponent('DateTimeInput', DateTimeInput);
    this.catalog.registerComponent('Divider', Divider);
    this.catalog.registerComponent('Icon', Icon);
    this.catalog.registerComponent('Image', Image);
    this.catalog.registerComponent('List', List);
    this.catalog.registerComponent('Modal', Modal);
    this.catalog.registerComponent('MultipleChoice', MultipleChoice);
    this.catalog.registerComponent('Row', Row);
    this.catalog.registerComponent('Slider', Slider);
    this.catalog.registerComponent('Tabs', Tabs);
    this.catalog.registerComponent('Text', Text);
    this.catalog.registerComponent('TextField', TextField);
    this.catalog.registerComponent('Video', Video);
  }
}
