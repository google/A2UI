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

const dividerExamples: Array<{ description: string; component: Types.AnyComponentNode }> = [
  {
    description: 'Horizontal Divider',
    component: {
      type: 'Divider',
      id: 'divider-1',
      properties: {}
    },
  },
];
</script>

<template>
  <div class="example-section">
    <h2>Divider Component</h2>
    <p class="example-description">
      Visual separator to divide content sections.
    </p>

    <div v-for="(example, index) in dividerExamples" :key="index" class="example-demo">
      <h3>{{ example.description }}</h3>
      <div style="padding: 20px 0;">
        <p>Content above divider</p>
        <A2UiRenderer
          surface-id="example"
          :component="example.component"
        />
        <p>Content below divider</p>
      </div>
    </div>
  </div>
</template>
