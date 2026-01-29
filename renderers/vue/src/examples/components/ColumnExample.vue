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

const columnExamples: Array<{ description: string; component: Types.AnyComponentNode }> = [
  {
    description: 'Column with Multiple Items',
    component: {
      type: 'Column',
      id: 'col-1',
      properties: {
        children: [
          {
            type: 'Text',
            id: 'col-heading',
            properties: { text: { literal: 'Vertical Layout' }, usageHint: 'h3' }
          },
          {
            type: 'Text',
            id: 'col-text-1',
            properties: { text: { literal: 'First item in column' }, usageHint: 'body' }
          },
          {
            type: 'Text',
            id: 'col-text-2',
            properties: { text: { literal: 'Second item in column' }, usageHint: 'body' }
          },
          {
            type: 'Text',
            id: 'col-text-3',
            properties: { text: { literal: 'Third item in column' }, usageHint: 'body' }
          }
        ]
      }
    },
  },
];
</script>

<template>
  <div class="example-section">
    <h2>Column Component</h2>
    <p class="example-description">
      Column layout arranges children vertically in a flexbox container.
    </p>

    <div v-for="(example, index) in columnExamples" :key="index" class="example-demo">
      <h3>{{ example.description }}</h3>
      <A2UiRenderer
        surface-id="example"
        :component="example.component"
      />
    </div>
  </div>
</template>
