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

const cardExamples: Array<{ description: string; component: Types.AnyComponentNode }> = [
  {
    description: 'Simple Card',
    component: {
      type: 'Card',
      id: 'card-simple',
      properties: {
        children: [{
          type: 'Text',
          id: 'card-text-1',
          properties: { text: { literalString: 'This is a simple card with text content' }, usageHint: 'body' }
        }]
      }
    },
  },
  {
    description: 'Card with Multiple Children',
    component: {
      type: 'Card',
      id: 'card-multi',
      properties: {
        children: [
          {
            type: 'Text',
            id: 'card-heading',
            properties: { text: { literalString: 'Card Title' }, usageHint: 'h3' }
          },
          {
            type: 'Text',
            id: 'card-body',
            properties: { text: { literalString: 'This card contains multiple child components arranged vertically.' }, usageHint: 'body' }
          },
          {
            type: 'Text',
            id: 'card-caption',
            properties: { text: { literalString: 'Additional information' }, usageHint: 'caption' }
          }
        ]
      }
    },
  },
];
</script>

<template>
  <div class="example-section">
    <h2>Card Component</h2>
    <p class="example-description">
      Cards are container components that group related content together with consistent styling.
    </p>

    <div v-for="(example, index) in cardExamples" :key="index" class="example-demo">
      <h3>{{ example.description }}</h3>
      <A2UiRenderer
        surface-id="example"
        :component="example.component"
      />
    </div>
  </div>
</template>
