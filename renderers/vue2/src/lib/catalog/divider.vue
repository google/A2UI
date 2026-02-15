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
  <div class="a2ui-divider-wrapper" :style="weightStyle">
    <hr
      class="a2ui-divider"
      :class="theme.components.Divider"
      :style="theme.additionalStyles && theme.additionalStyles.Divider"
    />
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import type { Types } from '@a2ui/lit/0.8';
import DynamicComponentMixin, { DynamicComponentVue } from '../rendering/mixins/dynamic-component';

export default DynamicComponentVue.extend({
  name: 'A2UIDivider',

  mixins: [DynamicComponentMixin],

  props: {
    axis: {
      type: String as PropType<'horizontal' | 'vertical' | null>,
      default: 'horizontal',
    },
  },
});
</script>

<style>
.a2ui-divider-wrapper {
  display: block;
  min-height: 0;
  overflow: auto;
}

.a2ui-divider {
  height: 1px;
  background: #ccc;
  border: none;
}
</style>
