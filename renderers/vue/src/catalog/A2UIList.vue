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
import * as Types from '@a2ui/web_core/types/types';
import { useDynamicComponent } from '@/rendering/useDynamicComponent';
import A2UiRenderer from '@/rendering/A2UIRenderer.vue';

const props = defineProps<{
  surfaceId: Types.SurfaceID | null;
  component: Types.ListNode;
  weight: string | number;
  direction?: 'vertical' | 'horizontal';
}>();

const { theme } = useDynamicComponent(props);
</script>

<template>
  <a2ui-list
    :data-direction="direction ?? 'vertical'"
  >
    <section :class="theme.components.List" :style="theme.additionalStyles?.List">
      <A2UiRenderer
        v-for="(child, index) in component.properties.children"
        :key="child.id || index"
        :surface-id="surfaceId!"
        :component="child"
      />
    </section>
  </a2ui-list>
</template>

<style scoped>
a2ui-list {
  display: block;
  flex: v-bind(props.weight);
  min-height: 0;
  overflow: auto;
}

a2ui-list[data-direction='vertical'] section {
  display: grid;
}

a2ui-list[data-direction='horizontal'] section {
  display: flex;
  max-width: 100%;
  overflow-x: scroll;
  overflow-y: hidden;
  scrollbar-width: none;
}

a2ui-list[data-direction='horizontal'] section > :deep(*) {
  flex: 1 0 fit-content;
  max-width: min(80%, 400px);
}
</style>
