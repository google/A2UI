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
  <div
    class="a2ui-list"
    :class="[theme.components.List, directionClass]"
    :style="[weightStyle, theme.additionalStyles && theme.additionalStyles.List]"
  >
    <A2UIRenderer
      v-for="child in children"
      :key="child.id"
      :surface-id="surfaceId"
      :component="child"
    />
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import type { Types } from '@a2ui/lit/0.8';
import DynamicComponentMixin, { DynamicComponentVue } from '../rendering/mixins/dynamic-component';
import A2UIRenderer from '../rendering/renderer.vue';

export default DynamicComponentVue.extend({
  name: 'A2UIList',

  mixins: [DynamicComponentMixin],

  components: {
    A2UIRenderer,
  },

  props: {
    direction: {
      type: String as PropType<'vertical' | 'horizontal'>,
      default: 'vertical',
    },
  },

  computed: {
    children(): Types.AnyComponentNode[] {
      return (this.component as Types.ListNode).properties.children || [];
    },

    directionClass(): string {
      return `a2ui-list--${this.direction}`;
    },
  },
});
</script>

<style>
.a2ui-list {
  flex: var(--weight);
  box-sizing: border-box;
}

.a2ui-list--vertical {
  display: grid;
  gap: 8px;
}

.a2ui-list--horizontal {
  display: flex;
  flex-direction: row;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
}

.a2ui-list--horizontal::-webkit-scrollbar {
  display: none;
}

.a2ui-list--horizontal > * {
  flex-shrink: 0;
  max-width: 280px;
}
</style>
