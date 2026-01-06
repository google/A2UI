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
  <div class="a2ui-checkbox" :style="weightStyle">
    <section
      :class="theme.components.CheckBox.container"
      :style="theme.additionalStyles && theme.additionalStyles.CheckBox"
    >
      <input
        autocomplete="off"
        type="checkbox"
        :id="inputId"
        :checked="inputChecked"
        :class="theme.components.CheckBox.element"
        @change="handleChange"
      />

      <label
        :for="inputId"
        :class="theme.components.CheckBox.label"
      >{{ resolvedLabel }}</label>
    </section>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import type { PropType } from 'vue';
import type { Primitives, Types } from '@a2ui/lit/0.8';
import DynamicComponentMixin from '../rendering/mixins/dynamic-component';

export default Vue.extend({
  name: 'A2UICheckbox',

  mixins: [DynamicComponentMixin],

  props: {
    value: {
      type: Object as PropType<Primitives.BooleanValue | null>,
      default: null,
    },
    label: {
      type: Object as PropType<Primitives.StringValue | null>,
      default: null,
    },
  },

  data() {
    return {
      inputId: '',
    };
  },

  computed: {
    inputChecked(): boolean {
      const value = (this as any).resolvePrimitive(this.value);
      return value ?? false;
    },

    resolvedLabel(): string | null {
      return (this as any).resolvePrimitive(this.label);
    },
  },

  created() {
    this.inputId = (this as any).getUniqueId('a2ui-checkbox');
  },

  methods: {
    handleChange(event: Event) {
      const path = this.value?.path;
      const target = event.target as HTMLInputElement;

      if (!target || !path) return;

      (this as any).setData(path, target.checked);
    },
  },
});
</script>

<style>
.a2ui-checkbox {
  display: block;
  flex: var(--weight);
  min-height: 0;
  overflow: auto;
}

.a2ui-checkbox input {
  display: block;
  width: 100%;
}
</style>
