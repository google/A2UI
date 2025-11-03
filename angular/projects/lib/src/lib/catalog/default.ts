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

import { inputBinding } from '@angular/core';
import { Catalog } from '../rendering/catalog';
import { Row } from './row';
import { Column } from './column';
import { Text } from './text';

export const DEFAULT_CATALOG: Catalog = {
  Row: {
    type: () => Row,
    bindings: ({ properties }) => [
      inputBinding('alignment', () => properties.alignment ?? 'stretch'),
      inputBinding('distribution', () => properties.distribution ?? 'start'),
    ],
  },

  Column: {
    type: () => Column,
    bindings: ({ properties }) => [
      inputBinding('alignment', () => properties.alignment ?? 'stretch'),
      inputBinding('distribution', () => properties.distribution ?? 'start'),
    ],
  },

  List: {
    type: () => import('./list').then((r) => r.List),
    bindings: ({ properties }) => [
      inputBinding('direction', () => properties.direction ?? 'vertical'),
    ],
  },

  Card: () => import('./card').then((r) => r.Card),

  Heading: {
    type: () => import('./heading').then((r) => r.Heading),
    bindings: ({ properties }) => [
      inputBinding('text', () => properties.text),
      inputBinding('level', () => properties.level),
    ],
  },

  Image: {
    type: () => import('./image').then((r) => r.Image),
    bindings: ({ properties }) => [inputBinding('url', () => properties.url)],
  },

  Icon: {
    type: () => import('./icon').then((r) => r.Icon),
    bindings: ({ properties }) => [inputBinding('name', () => properties.name)],
  },

  Video: {
    type: () => import('./video').then((r) => r.Video),
    bindings: ({ properties }) => [inputBinding('url', () => properties.url)],
  },

  AudioPlayer: {
    type: () => import('./audio').then((r) => r.Audio),
    bindings: ({ properties }) => [inputBinding('url', () => properties.url)],
  },

  Text: {
    type: () => Text,
    bindings: ({ properties }) => [inputBinding('text', () => properties.text)],
  },

  Button: {
    type: () => import('./button').then((r) => r.Button),
    bindings: ({ properties }) => [inputBinding('action', () => properties.action)],
  },

  Divider: () => import('./divider').then((r) => r.Divider),

  MultipleChoice: {
    type: () => import('./multiple-choice').then((r) => r.MultipleChoice),
    bindings: ({ properties }) => [
      inputBinding('options', () => properties.options || []),
      inputBinding('value', () => properties.selections),
    ],
  },

  TextField: {
    type: () => import('./text-field').then((r) => r.TextField),
    bindings: ({ properties }) => [
      inputBinding('text', () => properties.text ?? null),
      inputBinding('label', () => properties.label),
      inputBinding('inputType', () => properties.type),
    ],
  },

  DateTimeInput: {
    type: () => import('./datetime-input').then((r) => r.DatetimeInput),
    bindings: ({ properties }) => [
      inputBinding('enableDate', () => properties.enableDate),
      inputBinding('enableTime', () => properties.enableTime),
      inputBinding('value', () => properties.value),
    ],
  },

  CheckBox: {
    type: () => import('./checkbox').then((r) => r.Checkbox),
    bindings: ({ properties }) => [
      inputBinding('label', () => properties.label),
      inputBinding('value', () => properties.value),
    ],
  },

  Slider: {
    type: () => import('./slider').then((r) => r.Slider),
    bindings: ({ properties }) => [
      inputBinding('value', () => properties.value),
      inputBinding('minValue', () => properties.minValue),
      inputBinding('maxValue', () => properties.maxValue),
    ],
  },

  Tabs: {
    type: () => import('./tabs').then((r) => r.Tabs),
    bindings: ({ properties }) => [inputBinding('tabs', () => properties.tabItems)],
  },
};
