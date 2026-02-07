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
import * as Primitives from '@a2ui/web_core/types/primitives';
import * as Types from '@a2ui/web_core/types/types';
import { useDynamicComponent } from '@/rendering/useDynamicComponent';

const props = defineProps<{
  surfaceId: Types.SurfaceID | null;
  component: Types.MultipleChoiceNode;
  weight: string | number;
  options: { label: Primitives.StringValue; value: string }[];
  value: Primitives.StringValue | null;
  description: string;
}>();

const { theme, resolvePrimitive, getUniqueId, processor } = useDynamicComponent(props);

const selectId = getUniqueId('a2ui-multiple-choice');
const selectValue = computed(() => resolvePrimitive(props.value));

function handleChange(event: Event) {
  const path = props.value?.path;

  if (!(event.target instanceof HTMLSelectElement) || !event.target.value || !path) {
    return;
  }

  processor.setData(
    props.component,
    processor.resolvePath(path, props.component.dataContextPath),
    event.target.value,
  );
}
</script>

<template>
  <a2ui-multiple-choice>
    <section :class="theme.components.MultipleChoice.container">
      <label :class="theme.components.MultipleChoice.label" :for="selectId">
        {{ description }}
      </label>

      <select
        @change="handleChange"
        :id="selectId"
        :value="selectValue"
        :class="theme.components.MultipleChoice.element"
        :style="theme.additionalStyles?.MultipleChoice"
      >
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ resolvePrimitive(option.label) }}
        </option>
      </select>
    </section>
  </a2ui-multiple-choice>
</template>

<style scoped>
a2ui-multiple-choice {
  display: block;
  flex: v-bind(props.weight);
  min-height: 0;
  overflow: auto;
}

select {
  width: 100%;
  box-sizing: border-box;
}
</style>
