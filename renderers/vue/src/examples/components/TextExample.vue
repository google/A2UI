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

const textExamples: Array<{ description: string; component: Types.AnyComponentNode }> = [
  {
    description: 'Heading 1',
    component: {
      type: 'Text',
      id: 'text-h1',
      properties: {
        text: { literal: 'This is a Heading 1' },
        usageHint: 'h1'
      }
    },
  },
  {
    description: 'Heading 2',
    component: {
      type: 'Text',
      id: 'text-h2',
      properties: {
        text: { literal: 'This is a Heading 2' },
        usageHint: 'h2'
      }
    },
  },
  {
    description: 'Body text',
    component: {
      type: 'Text',
      id: 'text-body',
      properties: {
        text: { literal: 'This is regular body text. It can be used for paragraphs and general content.' },
        usageHint: 'body'
      }
    },
  },
  {
    description: 'Caption text',
    component: {
      type: 'Text',
      id: 'text-caption',
      properties: {
        text: { literal: 'This is caption text - smaller and lighter' },
        usageHint: 'caption'
      }
    },
  },
  {
    description: 'Markdown text',
    component: {
      type: 'Text',
      id: 'text-markdown',
      properties: {
        text: { literal: '**Bold text**, *italic text*, and `code text`' },
        usageHint: 'body'
      }
    },
  },
];
</script>

<template>
  <div class="example-section">
    <h2>Text Component</h2>
    <p class="example-description">
      The Text component displays text with various styles and supports markdown formatting.
    </p>

    <div v-for="(example, index) in textExamples" :key="index" class="example-demo">
      <h3>{{ example.description }}</h3>
      <A2UiRenderer
        surface-id="example"
        :component="example.component"
      />
    </div>
  </div>
</template>
