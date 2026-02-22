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
  component: Types.SliderNode;
  weight: string | number;
  value: Primitives.NumberValue | null;
  label?: string;
  minValue: number | undefined;
  maxValue: number | undefined;
}>();

const { theme, resolvePrimitive, getUniqueId, setData } = useDynamicComponent(props);

const inputId = getUniqueId('a2ui-slider');
const resolvedValue = computed(() => resolvePrimitive(props.value) ?? 0);

function handleInput(event: Event) {
  const path = props.value?.path;

  if (!(event.target instanceof HTMLInputElement) || !path) {
    return;
  }

  setData(props.component, path, event.target.valueAsNumber, props.surfaceId);
}
</script>

<template>
  <a2ui-slider>
    <section :class="theme.components.Slider.container">
      <label :class="theme.components.Slider.label" :for="inputId">
        {{ label }}
      </label>

      <input
        autocomplete="off"
        type="range"
        :value="resolvedValue"
        :min="minValue"
        :max="maxValue"
        :id="inputId"
        @input="handleInput"
        :class="theme.components.Slider.element"
        :style="theme.additionalStyles?.Slider"
      />
    </section>
  </a2ui-slider>
</template>

<style scoped>
a2ui-slider {
  display: block;
  flex: v-bind(props.weight);
}

input {
  display: block;
  width: 100%;
  box-sizing: border-box;
}
</style>
