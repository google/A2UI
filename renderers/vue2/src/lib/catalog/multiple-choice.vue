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
  <div class="a2ui-multiple-choice" :style="weightStyle">
    <section
      :class="theme.components.MultipleChoice.container"
      :style="theme.additionalStyles && theme.additionalStyles.MultipleChoice"
    >
      <label
        v-if="description"
        :for="inputId"
        :class="theme.components.MultipleChoice.label"
      >{{ description }}</label>

      <select
        :id="inputId"
        :class="theme.components.MultipleChoice.element"
        :value="currentSelection"
        @change="handleChange"
      >
        <option value="" disabled>Select an option</option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >{{ getOptionLabel(option) }}</option>
      </select>
    </section>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import type { Primitives, Types } from '@a2ui/lit/0.8';
import DynamicComponentMixin, { DynamicComponentVue } from '../rendering/mixins/dynamic-component';

interface SelectOption {
  label: Primitives.StringValue;
  value: string;
}

export default DynamicComponentVue.extend({
  name: 'A2UIMultipleChoice',

  mixins: [DynamicComponentMixin],

  props: {
    options: {
      type: Array as PropType<SelectOption[]>,
      default: () => [],
    },
    value: {
      type: Object as PropType<Types.ResolvedMultipleChoice['selections'] | null>,
      default: null,
    },
    description: {
      type: String,
      default: 'Select an item',
    },
  },

  data() {
    return {
      inputId: '',
    };
  },

  computed: {
    currentSelection(): string {
      if (!this.value) return '';

      // Handle path binding
      if (this.value.path) {
        const resolved = this.processor.getData(
          this.component,
          this.value.path,
          this.surfaceId ?? undefined
        );
        if (Array.isArray(resolved)) {
          return resolved[0] ?? '';
        }
        return resolved ?? '';
      }

      // Handle literal array
      if (this.value.literalArray) {
        return this.value.literalArray[0] ?? '';
      }

      return '';
    },
  },

  created() {
    this.inputId = this.getUniqueId('a2ui-select');
  },

  methods: {
    getOptionLabel(option: SelectOption): string | null {
      return this.resolvePrimitive(option.label) as string | null;
    },

    handleChange(event: Event) {
      const path = this.value?.path;
      const target = event.target as HTMLSelectElement;

      if (!target || !path) return;

      // Store as array for consistency
      this.setData(path, [target.value]);
    },
  },
});
</script>

<style>
.a2ui-multiple-choice {
  display: flex;
  flex: var(--weight);
}

.a2ui-multiple-choice section,
.a2ui-multiple-choice select,
.a2ui-multiple-choice label {
  box-sizing: border-box;
}

.a2ui-multiple-choice select {
  display: block;
  width: 100%;
}

.a2ui-multiple-choice label {
  display: block;
  margin-bottom: 4px;
}
</style>
