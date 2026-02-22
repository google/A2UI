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
  component: Types.TextFieldNode;
  weight: string | number;
  text: Primitives.StringValue | null;
  label: Primitives.StringValue | null;
  inputType: Types.ResolvedTextField['type'] | null;
}>();

const { theme, resolvePrimitive, getUniqueId, setData } = useDynamicComponent(props);

const inputValue = computed(() => resolvePrimitive(props.text) || '');
const resolvedLabel = computed(() => resolvePrimitive(props.label));
const inputId = getUniqueId('a2ui-input');

function handleInput(event: Event) {
  const path = props.text?.path;

  if (!(event.target instanceof HTMLInputElement) || !path) {
    return;
  }

  setData(props.component, path, event.target.value, props.surfaceId);
}
</script>

<template>
  <a2ui-text-field>
    <section :class="theme.components.TextField.container">
      <label
        v-if="resolvedLabel"
        :for="inputId"
        :class="theme.components.TextField.label"
      >
        {{ resolvedLabel }}
      </label>

      <input
        autocomplete="off"
        :class="theme.components.TextField.element"
        :style="theme.additionalStyles?.TextField"
        @input="handleInput"
        :id="inputId"
        :value="inputValue"
        placeholder="Please enter a value"
        :type="inputType === 'number' ? 'number' : 'text'"
      />
    </section>
  </a2ui-text-field>
</template>

<style scoped>
a2ui-text-field {
  display: flex;
  flex: v-bind(props.weight);
}

section,
input,
label {
  box-sizing: border-box;
}

input {
  display: block;
  width: 100%;
}

label {
  display: block;
  margin-bottom: 4px;
}
</style>
