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

import * as Types from '@a2ui/web_core/types/types';
import type { Catalog } from '@/rendering/catalog';

import Row from './A2UIRow.vue';
import Column from './A2UIColumn.vue';
import Text from './A2UIText.vue';

export const DEFAULT_CATALOG: Catalog = {
  Row: {
    type: () => Row,
    props: (node) => {
      const properties = (node as Types.RowNode).properties;
      return {
        alignment: properties.alignment ?? 'stretch',
        distribution: properties.distribution ?? 'start',
      };
    },
  },

  Column: {
    type: () => Column,
    props: (node) => {
      const properties = (node as Types.ColumnNode).properties;
      return {
        alignment: properties.alignment ?? 'stretch',
        distribution: properties.distribution ?? 'start',
      };
    },
  },

  List: {
    type: () => import('./A2UIList.vue').then((m) => m.default),
    props: (node) => {
      const properties = (node as Types.ListNode).properties;
      return { direction: properties.direction ?? 'vertical' };
    },
  },

  Card: () => import('./A2UICard.vue').then((m) => m.default),

  Image: {
    type: () => import('./A2UIImage.vue').then((m) => m.default),
    props: (node) => {
      const properties = (node as Types.ImageNode).properties;
      return {
        url: properties.url,
        usageHint: properties.usageHint,
      };
    },
  },

  Icon: {
    type: () => import('./A2UIIcon.vue').then((m) => m.default),
    props: (node) => {
      const properties = (node as Types.IconNode).properties;
      return { name: properties.name };
    },
  },

  Video: {
    type: () => import('./A2UIVideo.vue').then((m) => m.default),
    props: (node) => {
      const properties = (node as Types.VideoNode).properties;
      return { url: properties.url };
    },
  },

  AudioPlayer: {
    type: () => import('./A2UIAudio.vue').then((m) => m.default),
    props: (node) => {
      const properties = (node as Types.AudioPlayerNode).properties;
      return { url: properties.url };
    },
  },

  Text: {
    type: () => Text,
    props: (node) => {
      const properties = (node as Types.TextNode).properties;
      return {
        text: properties.text,
        usageHint: properties.usageHint || null,
      };
    },
  },

  Button: {
    type: () => import('./A2UIButton.vue').then((m) => m.default),
    props: (node) => {
      const properties = (node as Types.ButtonNode).properties;
      return { action: properties.action };
    },
  },

  Divider: () => import('./A2UIDivider.vue').then((m) => m.default),

  MultipleChoice: {
    type: () => import('./A2UIMultipleChoice.vue').then((m) => m.default),
    props: (node) => {
      const properties = (node as Types.MultipleChoiceNode).properties;
      return {
        options: properties.options || [],
        value: properties.selections,
        description: 'Select an item',
      };
    },
  },

  TextField: {
    type: () => import('./A2UITextField.vue').then((m) => m.default),
    props: (node) => {
      const properties = (node as Types.TextFieldNode).properties;
      return {
        text: properties.text ?? null,
        label: properties.label,
        inputType: properties.type,
      };
    },
  },

  DateTimeInput: {
    type: () => import('./A2UIDateTimeInput.vue').then((m) => m.default),
    props: (node) => {
      const properties = (node as Types.DateTimeInputNode).properties;
      return {
        enableDate: properties.enableDate,
        enableTime: properties.enableTime,
        value: properties.value,
      };
    },
  },

  CheckBox: {
    type: () => import('./A2UICheckbox.vue').then((m) => m.default),
    props: (node) => {
      const properties = (node as Types.CheckboxNode).properties;
      return {
        label: properties.label,
        value: properties.value,
      };
    },
  },

  Slider: {
    type: () => import('./A2UISlider.vue').then((m) => m.default),
    props: (node) => {
      const properties = (node as Types.SliderNode).properties;
      return {
        value: properties.value,
        minValue: properties.minValue,
        maxValue: properties.maxValue,
        label: '',
      };
    },
  },

  Tabs: {
    type: () => import('./A2UITabs.vue').then((m) => m.default),
    props: (node) => {
      const properties = (node as Types.TabsNode).properties;
      return { tabs: properties.tabItems };
    },
  },

  Modal: {
    type: () => import('./A2UIModal.vue').then((m) => m.default),
    props: () => ({}),
  },
};
