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
  <div class="a2ui-slider" :style="weightStyle">
    <section
      :class="theme.components.Slider.container"
      :style="theme.additionalStyles && theme.additionalStyles.Slider"
    >
      <label
        v-if="label"
        :for="inputId"
        :class="theme.components.Slider.label"
      >{{ label }}</label>

      <input
        type="range"
        :class="theme.components.Slider.element"
        :id="inputId"
        :min="minValue"
        :max="maxValue"
        :value="currentValue"
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
  name: 'A2UISlider',

  mixins: [DynamicComponentMixin],

  props: {
    value: {
      type: Object as PropType<Primitives.NumberValue | null>,
      default: null,
    },
    minValue: {
      type: Number,
      default: 0,
    },
    maxValue: {
      type: Number,
      default: 100,
    },
    label: {
      type: String,
      default: '',
    },
  },

  data() {
    return {
      inputId: '',
    };
  },

  computed: {
    currentValue(): number {
      const resolved = this.resolvePrimitive(this.value);
      if (typeof resolved === 'number') {
        return resolved;
      }
      return this.minValue;
    },
  },

  created() {
    this.inputId = this.getUniqueId('a2ui-slider');
  },

  methods: {
    handleInput(event: Event) {
      const path = this.value?.path;
      const target = event.target as HTMLInputElement;

      if (!target || !path) return;

      this.setData(path, target.valueAsNumber);
    },
  },
});
</script>

<style>
.a2ui-slider {
  display: flex;
  flex: var(--weight);
}

.a2ui-slider section,
.a2ui-slider input,
.a2ui-slider label {
  box-sizing: border-box;
}

.a2ui-slider input[type="range"] {
  display: block;
  width: 100%;
}

.a2ui-slider label {
  display: block;
  margin-bottom: 4px;
}
</style>
