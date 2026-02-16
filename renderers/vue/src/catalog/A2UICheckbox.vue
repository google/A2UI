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
  component: Types.CheckboxNode;
  weight: string | number;
  value: Primitives.BooleanValue | null;
  label: Primitives.StringValue | null;
}>();

const { theme, resolvePrimitive, getUniqueId, setData } = useDynamicComponent(props);

const inputChecked = computed(() => resolvePrimitive(props.value) ?? false);
const resolvedLabel = computed(() => resolvePrimitive(props.label));
const inputId = getUniqueId('a2ui-checkbox');

function handleChange(event: Event) {
  const path = props.value?.path;

  if (!(event.target instanceof HTMLInputElement) || !path) {
    return;
  }

  setData(props.component, path, event.target.checked, props.surfaceId);
}
</script>

<template>
  <a2ui-checkbox>
    <section
      :class="theme.components.CheckBox.container"
      :style="theme.additionalStyles?.CheckBox"
    >
      <input
        autocomplete="off"
        type="checkbox"
        :id="inputId"
        :checked="inputChecked"
        :class="theme.components.CheckBox.element"
        @change="handleChange"
      />

      <label :for="inputId" :class="theme.components.CheckBox.label">
        {{ resolvedLabel }}
      </label>
    </section>
  </a2ui-checkbox>
</template>

<style scoped>
a2ui-checkbox {
  display: block;
  flex: v-bind(props.weight);
  min-height: 0;
  overflow: auto;
}

input {
  display: block;
  width: 100%;
}
</style>
