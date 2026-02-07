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
import { computed } from 'vue';
import * as Types from '@a2ui/web_core/types/types';
import { useDynamicComponent } from '@/rendering/useDynamicComponent';
import A2UiRenderer from '@/rendering/A2UIRenderer.vue';

const props = defineProps<{
  surfaceId: Types.SurfaceID | null;
  component: Types.CardNode;
  weight: string | number;
}>();

const { theme } = useDynamicComponent(props);

const children = computed(() => {
  const properties = props.component.properties;
  return properties.children || [properties.child];
});
</script>

<template>
  <a2ui-card>
    <section :class="theme.components.Card" :style="theme.additionalStyles?.Card">
      <A2UiRenderer
        v-for="(child, index) in children"
        :key="child.id || (child.type + '-' +index)"
        :surface-id="surfaceId!"
        :component="child"
      />
    </section>
  </a2ui-card>
</template>

<style scoped>
a2ui-card {
  display: block;
  flex: v-bind(props.weight);
  min-height: 0;
  overflow: auto;
}

a2ui-card > section {
  height: 100%;
  width: 100%;
  min-height: 0;
  overflow: auto;
}

a2ui-card > section > :deep(*) {
  height: 100%;
  width: 100%;
}
</style>
