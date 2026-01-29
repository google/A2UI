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
import { ref, computed } from 'vue';
import * as Types from '@a2ui/web_core/types/types';
import * as Styles from '@a2ui/web_core/styles/index';
import { useDynamicComponent } from '@/rendering/useDynamicComponent';
import A2UiRenderer from '@/rendering/A2UIRenderer.vue';

const props = defineProps<{
  surfaceId: Types.SurfaceID | null;
  component: Types.TabsNode;
  weight: string | number;
  tabs: Types.ResolvedTabItem[];
}>();

const { theme, resolvePrimitive } = useDynamicComponent(props);

const selectedIndex = ref(0);

const buttonClasses = computed(() => {
  const index = selectedIndex.value;

  return props.tabs.map((_, i) => {
    return i === index
      ? Styles.merge(
          theme.components.Tabs.controls.all,
          theme.components.Tabs.controls.selected,
        )
      : theme.components.Tabs.controls.all;
  });
});
</script>

<template>
  <a2ui-tabs>
    <section :class="theme.components.Tabs.container" :style="theme.additionalStyles?.Tabs">
      <div :class="theme.components.Tabs.element">
        <button
          v-for="(tab, index) in tabs"
          :key="index"
          @click="selectedIndex = index"
          :disabled="selectedIndex === index"
          :class="buttonClasses[index]"
        >
          {{ resolvePrimitive(tab.title) }}
        </button>
      </div>

      <A2UiRenderer
        :surface-id="surfaceId!"
        :component="tabs[selectedIndex].child"
      />
    </section>
  </a2ui-tabs>
</template>

<style scoped>
.a2ui-tabs {
  display: block;
  flex: v-bind(props.weight);
}
</style>
