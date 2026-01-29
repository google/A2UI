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
import { ref } from 'vue';
import ButtonExample from './components/ButtonExample.vue';
import TextExample from './components/TextExample.vue';
import CardExample from './components/CardExample.vue';
import DividerExample from './components/DividerExample.vue';
import RowExample from './components/RowExample.vue';
import ColumnExample from './components/ColumnExample.vue';
import ListExample from './components/ListExample.vue';
import {provideA2UI} from "@/config.ts";
import {DEFAULT_CATALOG} from "@/catalog/default.ts";
import { theme } from './theme';
provideA2UI({
  catalog: DEFAULT_CATALOG,
  theme,
});
const currentExample = ref('all');

const examples = [
  { name: 'all', label: 'All Examples', component: null },
  { name: 'text', label: 'Text', component: TextExample },
  { name: 'button', label: 'Button', component: ButtonExample },
  { name: 'card', label: 'Card', component: CardExample },
  { name: 'row', label: 'Row', component: RowExample },
  { name: 'column', label: 'Column', component: ColumnExample },
  { name: 'list', label: 'List', component: ListExample },
  { name: 'divider', label: 'Divider', component: DividerExample },
];

function setExample(name: string) {
  currentExample.value = name;
}
</script>

<template>
  <div class="examples-container">
    <div class="examples-header">
      <h1>A2UI Vue Components Examples</h1>
      <p>Interactive examples for all A2UI Vue components</p>
    </div>

    <nav class="examples-nav">
      <button
        v-for="example in examples"
        :key="example.name"
        :class="{ active: currentExample === example.name }"
        @click="setExample(example.name)"
      >
        {{ example.label }}
      </button>
    </nav>

    <div class="examples-content">
      <template v-if="currentExample === 'all'">
        <TextExample />
        <ButtonExample />
        <CardExample />
        <RowExample />
        <ColumnExample />
        <ListExample />
        <DividerExample />
      </template>
      <component v-else :is="examples.find(e => e.name === currentExample)?.component" />
    </div>
  </div>
</template>

<style scoped>
.examples-container {
  min-height: 100vh;
}
</style>
