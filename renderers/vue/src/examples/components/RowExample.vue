<!--
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
 -->

<script setup lang="ts">
import { A2UiRenderer } from '../../index';
import type * as Types from '@a2ui/web_core/types/types';

const rowExamples: Array<{ description: string; component: Types.AnyComponentNode }> = [
  {
    description: 'Row with Equal Width Children',
    component: {
      type: 'Row',
      id: 'row-1',
      properties: {
        children: [
          {
            type: 'Card',
            id: 'row-card-1',
            properties: {
              child: { type: 'Text', id: 't1', properties: { text: { literal: 'Item 1' }, usageHint: 'body' } },
              children: []
            }
          },
          {
            type: 'Card',
            id: 'row-card-2',
            properties: {
              child: { type: 'Text', id: 't2', properties: { text: { literal: 'Item 2' }, usageHint: 'body' } },
              children: []
            }
          },
          {
            type: 'Card',
            id: 'row-card-3',
            properties: {
              child: { type: 'Text', id: 't3', properties: { text: { literal: 'Item 3' }, usageHint: 'body' } },
              children: []
            }
          }
        ]
      }
    },
  },
  {
    description: 'Row with Different Content',
    component: {
      type: 'Row',
      id: 'row-2',
      properties: {
        children: [
          {
            type: 'Text',
            id: 'row-text-1',
            properties: { text: { literal: 'Label:' }, usageHint: 'h4' }
          },
          {
            type: 'Text',
            id: 'row-text-2',
            properties: { text: { literal: 'Value content here' }, usageHint: 'body' }
          }
        ]
      }
    },
  },
];
</script>

<template>
  <div class="example-section">
    <h2>Row Component</h2>
    <p class="example-description">
      Row layout arranges children horizontally in a flexbox container.
    </p>

    <div v-for="(example, index) in rowExamples" :key="index" class="example-demo">
      <h3>{{ example.description }}</h3>
      <A2UiRenderer
        surface-id="example"
        :component="example.component"
      />
    </div>
  </div>
</template>
