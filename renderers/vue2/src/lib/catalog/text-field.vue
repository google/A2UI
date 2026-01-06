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
  <div class="a2ui-text-field" :style="weightStyle">
    <section :class="theme.components.TextField.container">
      <label
        v-if="resolvedLabel"
        :for="inputId"
        :class="theme.components.TextField.label"
      >{{ resolvedLabel }}</label>

      <input
        autocomplete="off"
        :class="theme.components.TextField.element"
        :style="theme.additionalStyles && theme.additionalStyles.TextField"
        :id="inputId"
        :value="inputValue"
        :type="nativeInputType"
        placeholder="Please enter a value"
        @input="handleInput"
      />
    </section>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import type { PropType } from 'vue';
import type { Primitives, Types } from '@a2ui/lit/0.8';
import DynamicComponentMixin from '../rendering/mixins/dynamic-component';

export default Vue.extend({
  name: 'A2UITextField',

  mixins: [DynamicComponentMixin],

  props: {
    text: {
      type: Object as PropType<Primitives.StringValue | null>,
      default: null,
    },
    label: {
      type: Object as PropType<Primitives.StringValue | null>,
      default: null,
    },
    inputType: {
      type: String as PropType<Types.ResolvedTextField['type'] | null>,
      default: null,
    },
  },

  data() {
    return {
      inputId: '',
    };
  },

  computed: {
    inputValue(): string {
      const value = (this as any).resolvePrimitive(this.text);
      return value ?? '';
    },

    resolvedLabel(): string | null {
      return (this as any).resolvePrimitive(this.label);
    },

    nativeInputType(): string {
      switch (this.inputType) {
        case 'number':
          return 'number';
        case 'obscured':
          return 'password';
        case 'date':
          return 'date';
        default:
          return 'text';
      }
    },
  },

  created() {
    this.inputId = (this as any).getUniqueId('a2ui-input');
  },

  methods: {
    handleInput(event: Event) {
      const path = this.text?.path;
      const target = event.target as HTMLInputElement;

      if (!target || !path) return;

      (this as any).setData(path, target.value);
    },
  },
});
</script>

<style>
.a2ui-text-field {
  display: flex;
  flex: var(--weight);
}

.a2ui-text-field section,
.a2ui-text-field input,
.a2ui-text-field label {
  box-sizing: border-box;
}

.a2ui-text-field input {
  display: block;
  width: 100%;
}

.a2ui-text-field label {
  display: block;
  margin-bottom: 4px;
}
</style>
