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

import { Component, input } from '@angular/core';
import { v0_8 } from '@a2ui/web-lib';
import { Column } from '../column';
import { Row } from '../row';
import { Heading } from '../heading';
import { Text } from '../text';
import { List } from '../list';
import { Card } from '../card';
import { Image } from '../image';
import { Button } from '../button';
import { Video } from '../video';
import { Audio } from '../audio';
import { Divider } from '../divider';
import { MultipleChoice } from '../multiple-choice';
import { TextField } from '../text-field';
import { DatetimeInput } from '../datetime-input';
import { Checkbox } from '../checkbox';
import { Slider } from '../slider';
import { Tabs } from '../tabs';

@Component({
  selector: 'a2ui-renderer',
  templateUrl: 'renderer.html',
  imports: [
    Audio,
    Button,
    Card,
    Checkbox,
    Column,
    DatetimeInput,
    Divider,
    Heading,
    Image,
    List,
    MultipleChoice,
    Row,
    Slider,
    Tabs,
    Text,
    TextField,
    Video,
  ],
})
export class Renderer {
  readonly surfaceId = input.required<v0_8.Types.SurfaceID>();
  readonly component = input.required<v0_8.Types.AnyComponentNode>();
}
