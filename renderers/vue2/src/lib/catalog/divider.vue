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
  <hr
    class="a2ui-divider"
    :class="[theme.components.Divider, axisClass]"
    :style="[weightStyle, theme.additionalStyles && theme.additionalStyles.Divider]"
  />
</template>

<script lang="ts">
import Vue from 'vue';
import type { PropType } from 'vue';
import type { Types } from '@a2ui/lit/0.8';
import DynamicComponentMixin from '../rendering/mixins/dynamic-component';

export default Vue.extend({
  name: 'A2UIDivider',

  mixins: [DynamicComponentMixin],

  props: {
    axis: {
      type: String as PropType<'horizontal' | 'vertical' | null>,
      default: 'horizontal',
    },
  },

  computed: {
    axisClass(): string {
      return `a2ui-divider--${this.axis || 'horizontal'}`;
    },
  },
});
</script>

<style>
.a2ui-divider {
  flex: var(--weight);
  margin: 0;
  border: none;
  background-color: currentColor;
  opacity: 0.2;
}

.a2ui-divider--horizontal {
  width: 100%;
  height: 1px;
}

.a2ui-divider--vertical {
  width: 1px;
  height: 100%;
}
</style>
