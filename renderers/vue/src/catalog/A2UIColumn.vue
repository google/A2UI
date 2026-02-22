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
  component: Types.ColumnNode;
  weight: string | number;
  alignment?: Types.ResolvedColumn['alignment'];
  distribution?: Types.ResolvedColumn['distribution'];
}>();

const { theme } = useDynamicComponent(props);

const classes = computed(() => {
  const alignment = props.alignment ?? 'stretch';
  const distribution = props.distribution ?? 'start';

  return {
    ...theme.components.Column,
    [`align-${alignment}`]: true,
    [`distribute-${distribution}`]: true,
  };
});
</script>

<template>
  <a2ui-column>
    <section :class="classes" :style="theme.additionalStyles?.Column">
      <A2UiRenderer
        v-for="(child, index) in component.properties.children"
        :key="child.id || index"
        :surface-id="surfaceId!"
        :component="child"
      />
    </section>
  </a2ui-column>
</template>

<style scoped>
a2ui-column {
  display: flex;
  flex: v-bind(props.weight);
}

section {
  display: flex;
  flex-direction: column;
  min-width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.align-start {
  align-items: start;
}

.align-center {
  align-items: center;
}

.align-end {
  align-items: end;
}

.align-stretch {
  align-items: stretch;
}

.distribute-start {
  justify-content: start;
}

.distribute-center {
  justify-content: center;
}

.distribute-end {
  justify-content: end;
}

.distribute-spaceBetween {
  justify-content: space-between;
}

.distribute-spaceAround {
  justify-content: space-around;
}

.distribute-spaceEvenly {
  justify-content: space-evenly;
}
</style>
