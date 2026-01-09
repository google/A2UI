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

<template>
  <div class="a2ui-datetime-input" :style="weightStyle">
    <section
      :class="theme.components.DateTimeInput.container"
      :style="theme.additionalStyles && theme.additionalStyles.DateTimeInput"
    >
      <label
        v-if="label"
        :for="inputId"
        :class="theme.components.DateTimeInput.label"
      >{{ label }}</label>

      <input
        autocomplete="off"
        :class="theme.components.DateTimeInput.element"
        :id="inputId"
        :type="inputType"
        :value="formattedValue"
        @input="handleInput"
      />
    </section>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import type { Primitives, Types } from '@a2ui/lit/0.8';
import DynamicComponentMixin, { DynamicComponentVue } from '../rendering/mixins/dynamic-component';

export default DynamicComponentVue.extend({
  name: 'A2UIDateTimeInput',

  mixins: [DynamicComponentMixin],

  props: {
    value: {
      type: Object as PropType<Primitives.StringValue | null>,
      default: null,
    },
    enableDate: {
      type: Boolean,
      default: true,
    },
    enableTime: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      inputId: '',
    };
  },

  computed: {
    inputType(): string {
      if (this.enableDate && this.enableTime) {
        return 'datetime-local';
      } else if (this.enableTime) {
        return 'time';
      }
      return 'date';
    },

    label(): string {
      if (this.enableDate && this.enableTime) {
        return 'Date and Time';
      } else if (this.enableTime) {
        return 'Time';
      }
      return 'Date';
    },

    formattedValue(): string {
      const rawValue = this.resolvePrimitive(this.value) as string | null;
      if (!rawValue) return '';

      try {
        const date = new Date(rawValue);
        if (isNaN(date.getTime())) return '';

        if (this.enableDate && this.enableTime) {
          return this.formatDateTimeLocal(date);
        } else if (this.enableTime) {
          return this.formatTime(date);
        }
        return this.formatDate(date);
      } catch {
        return '';
      }
    },
  },

  created() {
    this.inputId = this.getUniqueId('a2ui-datetime');
  },

  methods: {
    formatDate(date: Date): string {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    formatTime(date: Date): string {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    },

    formatDateTimeLocal(date: Date): string {
      return `${this.formatDate(date)}T${this.formatTime(date)}`;
    },

    handleInput(event: Event) {
      const path = this.value?.path;
      const target = event.target as HTMLInputElement;

      if (!target || !path) return;

      // Convert to ISO string
      let isoValue = '';
      if (target.value) {
        try {
          const date = new Date(target.value);
          if (!isNaN(date.getTime())) {
            isoValue = date.toISOString();
          }
        } catch {
          isoValue = target.value;
        }
      }

      this.setData(path, isoValue);
    },
  },
});
</script>

<style>
.a2ui-datetime-input {
  display: flex;
  flex: var(--weight);
}

.a2ui-datetime-input section,
.a2ui-datetime-input input,
.a2ui-datetime-input label {
  box-sizing: border-box;
}

.a2ui-datetime-input input {
  display: block;
  width: 100%;
}

.a2ui-datetime-input label {
  display: block;
  margin-bottom: 4px;
}
</style>
