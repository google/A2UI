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
  component: Types.DateTimeInputNode;
  weight: string | number;
  value: Primitives.StringValue | null;
  enableDate: boolean;
  enableTime: boolean;
}>();

const { theme, resolvePrimitive, getUniqueId, setData } = useDynamicComponent(props);

const inputId = getUniqueId('a2ui-datetime-input');

const inputType = computed(() => {
  const enableDate = props.enableDate;
  const enableTime = props.enableTime;

  if (enableDate && enableTime) {
    return 'datetime-local';
  } else if (enableDate) {
    return 'date';
  } else if (enableTime) {
    return 'time';
  }

  return 'datetime-local';
});

const label = computed(() => {
  const type = inputType.value;

  if (type === 'date') {
    return 'Date';
  } else if (type === 'time') {
    return 'Time';
  }

  return 'Date & Time';
});

const inputValue = computed(() => {
  const type = inputType.value;
  const parsed = resolvePrimitive(props.value) || '';
  const date = parsed ? new Date(parsed) : null;

  if (!date || isNaN(date.getTime())) {
    return '';
  }

  const year = padNumber(date.getFullYear());
  const month = padNumber(date.getMonth() + 1);
  const day = padNumber(date.getDate());
  const hours = padNumber(date.getHours());
  const minutes = padNumber(date.getMinutes());

  if (type === 'date') {
    return `${year}-${month}-${day}`;
  } else if (type === 'time') {
    return `${hours}:${minutes}`;
  }

  return `${year}-${month}-${day}T${hours}:${minutes}`;
});

function padNumber(value: number) {
  return value.toString().padStart(2, '0');
}

function handleInput(event: Event) {
  const path = props.value?.path;

  if (!(event.target instanceof HTMLInputElement) || !path) {
    return;
  }

  setData(props.component, path, event.target.value, props.surfaceId);
}
</script>

<template>
  <a2ui-datetime-input>
    <section :class="theme.components.DateTimeInput.container">
      <label :for="inputId" :class="theme.components.DateTimeInput.label">
        {{ label }}
      </label>

      <input
        autocomplete="off"
        :type="inputType"
        :id="inputId"
        :class="theme.components.DateTimeInput.element"
        :style="theme.additionalStyles?.DateTimeInput"
        :value="inputValue"
        @input="handleInput"
      />
    </section>
  </a2ui-datetime-input>
</template>

<style scoped>
a2ui-datetime-input {
  display: block;
  flex: v-bind(props.weight);
  min-height: 0;
  overflow: auto;
}

input {
  display: block;
  width: 100%;
  box-sizing: border-box;
}
</style>
