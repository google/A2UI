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

const listExamples: Array<{ description: string; component: Types.AnyComponentNode }> = [
  {
    description: 'Simple List',
    component: {
      type: 'List',
      id: 'list-1',
      properties: {
        children: [
          { type: 'Text', id: 'li-1', properties: { text: { literal: 'First item' }, usageHint: 'body' } },
          { type: 'Text', id: 'li-2', properties: { text: { literal: 'Second item' }, usageHint: 'body' } },
          { type: 'Text', id: 'li-3', properties: { text: { literal: 'Third item' }, usageHint: 'body' } },
          { type: 'Text', id: 'li-4', properties: { text: { literal: 'Fourth item' }, usageHint: 'body' } }
        ]
      }
    },
  },
  {
    description: 'List with Cards',
    component: {
      type: 'List',
      id: 'list-2',
      properties: {
        children: [
          {
            type: 'Card',
            id: 'list-card-1',
            properties: {
              child: { type: 'Text', id: 'lc-t1', properties: { text: { literal: 'Card Item 1' }, usageHint: 'body' } },
              children: []
            }
          },
          {
            type: 'Card',
            id: 'list-card-2',
            properties: {
              child: { type: 'Text', id: 'lc-t2', properties: { text: { literal: 'Card Item 2' }, usageHint: 'body' } },
              children: []
            }
          }
        ]
      }
    },
  },
];
</script>

<template>
  <div class="example-section">
    <h2>List Component</h2>
    <p class="example-description">
      Lists display a collection of items in a vertical list format.
    </p>

    <div v-for="(example, index) in listExamples" :key="index" class="example-demo">
      <h3>{{ example.description }}</h3>
      <A2UiRenderer
        surface-id="example"
        :component="example.component"
      />
    </div>
  </div>
</template>
