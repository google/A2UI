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
    class="a2ui-card"
    :class="theme.components.Card"
    :style="[weightStyle, theme.additionalStyles && theme.additionalStyles.Card]"
  >
    <!-- Render either children array or single child -->
    <template v-if="childrenArray.length > 0">
      <A2UIRenderer
        v-for="child in childrenArray"
        :key="child.id"
        :surface-id="surfaceId"
        :component="child"
      />
    </template>
    <A2UIRenderer
      v-else-if="singleChild"
      :surface-id="surfaceId"
      :component="singleChild"
    />
  </div>
</template>

<script lang="ts">
import type { Types } from '@a2ui/lit/0.8';
import DynamicComponentMixin, { DynamicComponentVue } from '../rendering/mixins/dynamic-component';
import A2UIRenderer from '../rendering/renderer.vue';

export default DynamicComponentVue.extend({
  name: 'A2UICard',

  mixins: [DynamicComponentMixin],

  components: {
    A2UIRenderer,
  },

  computed: {
    cardNode(): Types.CardNode {
      return this.component as Types.CardNode;
    },

    singleChild(): Types.AnyComponentNode | null {
      return this.cardNode.properties.child || null;
    },

    childrenArray(): Types.AnyComponentNode[] {
      return this.cardNode.properties.children || [];
    },
  },
});
</script>

<style>
.a2ui-card {
  display: flex;
  flex-direction: column;
  flex: var(--weight);
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
}
</style>
