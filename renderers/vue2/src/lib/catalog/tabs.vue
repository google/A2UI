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
    class="a2ui-tabs"
    :style="weightStyle"
  >
    <section
      :class="theme.components.Tabs.container"
      :style="theme.additionalStyles && theme.additionalStyles.Tabs"
    >
      <div :class="theme.components.Tabs.element">
        <button
          v-for="(tab, index) in tabs"
          :key="index"
          :disabled="selectedIndex === index"
          :class="getButtonClasses(index)"
          @click="selectedIndex = index"
        >
          {{ getTabTitle(tab) }}
        </button>
      </div>

      <A2UIRenderer
        v-if="tabs.length > 0 && tabs[selectedIndex]"
        :surface-id="surfaceId"
        :component="tabs[selectedIndex].child"
      />
    </section>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import type { Types } from '@a2ui/lit/0.8';
import { Styles } from '@a2ui/lit/0.8';
import DynamicComponentMixin, { DynamicComponentVue } from '../rendering/mixins/dynamic-component';
import A2UIRenderer from '../rendering/renderer.vue';

export default DynamicComponentVue.extend({
  name: 'A2UITabs',

  mixins: [DynamicComponentMixin],

  components: {
    A2UIRenderer,
  },

  props: {
    tabs: {
      type: Array as PropType<Types.ResolvedTabItem[]>,
      required: true,
    },
  },

  data() {
    return {
      selectedIndex: 0,
    };
  },

  methods: {
    getTabTitle(tab: Types.ResolvedTabItem): string | null {
      return this.resolvePrimitive(tab.title) as string | null;
    },

    getButtonClasses(index: number): Record<string, boolean> {
      return index === this.selectedIndex
        ? Styles.merge(
            this.theme.components.Tabs.controls.all,
            this.theme.components.Tabs.controls.selected
          )
        : this.theme.components.Tabs.controls.all;
    },
  },
});
</script>

<style>
.a2ui-tabs {
  display: block;
  flex: var(--weight);
}
</style>
