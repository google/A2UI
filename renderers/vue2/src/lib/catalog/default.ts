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

import type { Types } from '@a2ui/lit/0.8';
import type { Catalog } from '../rendering/catalog';

/**
 * Default catalog configuration mapping all standard A2UI component types
 * to their Vue implementations.
 *
 * Components are loaded dynamically (lazy-loaded) for optimal bundle size.
 * Each entry includes a props mapping function that extracts component-specific
 * properties from the A2UI node.
 */
export const DEFAULT_CATALOG: Catalog = {
  Row: {
    type: () => import('./row.vue').then((m) => m.default),
    props: (node) => {
      const properties = (node as Types.RowNode).properties;
      return {
        alignment: properties.alignment ?? 'stretch',
        distribution: properties.distribution ?? 'start',
      };
    },
  },

  Column: {
    type: () => import('./column.vue').then((m) => m.default),
    props: (node) => {
      const properties = (node as Types.ColumnNode).properties;
      return {
        alignment: properties.alignment ?? 'stretch',
        distribution: properties.distribution ?? 'start',
      };
    },
  },

  List: {
    type: () => import('./list.vue').then((m) => m.default),
    props: (node) => {
      const properties = (node as Types.ListNode).properties;
      return {
        direction: properties.direction ?? 'vertical',
      };
    },
  },

  Card: () => import('./card.vue').then((m) => m.default),

  Image: {
    type: () => import('./image.vue').then((m) => m.default),
    props: (node) => {
      const properties = (node as Types.ImageNode).properties;
      return {
        url: properties.url,
        usageHint: properties.usageHint,
        fit: properties.fit,
      };
    },
  },

  Icon: {
    type: () => import('./icon.vue').then((m) => m.default),
    props: (node) => {
      const properties = (node as Types.IconNode).properties;
      return {
        name: properties.name,
      };
    },
  },

  Video: {
    type: () => import('./video.vue').then((m) => m.default),
    props: (node) => {
      const properties = (node as Types.VideoNode).properties;
      return {
        url: properties.url,
      };
    },
  },

  AudioPlayer: {
    type: () => import('./audio.vue').then((m) => m.default),
    props: (node) => {
      const properties = (node as Types.AudioPlayerNode).properties;
      return {
        url: properties.url,
      };
    },
  },

  Text: {
    type: () => import('./text.vue').then((m) => m.default),
    props: (node) => {
      const properties = (node as Types.TextNode).properties;
      return {
        text: properties.text,
        usageHint: properties.usageHint || null,
      };
    },
  },

  Button: {
    type: () => import('./button.vue').then((m) => m.default),
    props: (node) => {
      const properties = (node as Types.ButtonNode).properties;
      return {
        action: properties.action,
      };
    },
  },

  Divider: {
    type: () => import('./divider.vue').then((m) => m.default),
    props: (node) => {
      const properties = (node as Types.DividerNode).properties;
      return {
        axis: properties.axis ?? 'horizontal',
      };
    },
  },

  MultipleChoice: {
    type: () => import('./multiple-choice.vue').then((m) => m.default),
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
    type: () => import('./text-field.vue').then((m) => m.default),
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
    type: () => import('./datetime-input.vue').then((m) => m.default),
    props: (node) => {
      const properties = (node as Types.DateTimeInputNode).properties;
      return {
        enableDate: properties.enableDate ?? true,
        enableTime: properties.enableTime ?? false,
        value: properties.value,
      };
    },
  },

  CheckBox: {
    type: () => import('./checkbox.vue').then((m) => m.default),
    props: (node) => {
      const properties = (node as Types.CheckboxNode).properties;
      return {
        label: properties.label,
        value: properties.value,
      };
    },
  },

  Slider: {
    type: () => import('./slider.vue').then((m) => m.default),
    props: (node) => {
      const properties = (node as Types.SliderNode).properties;
      return {
        value: properties.value,
        minValue: properties.minValue ?? 0,
        maxValue: properties.maxValue ?? 100,
        label: '',
      };
    },
  },

  Tabs: {
    type: () => import('./tabs.vue').then((m) => m.default),
    props: (node) => {
      const properties = (node as Types.TabsNode).properties;
      return {
        tabs: properties.tabItems,
      };
    },
  },

  Modal: {
    type: () => import('./modal.vue').then((m) => m.default),
    props: () => ({}),
  },
};
