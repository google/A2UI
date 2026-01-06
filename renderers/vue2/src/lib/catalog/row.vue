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
  <div class="a2ui-row" :style="weightStyle">
    <section
      :class="classes"
      :style="theme.additionalStyles && theme.additionalStyles.Row"
    >
      <A2UIRenderer
        v-for="child in children"
        :key="child.id"
        :surface-id="surfaceId"
        :component="child"
      />
    </section>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import type { PropType } from 'vue';
import type { Types } from '@a2ui/lit/0.8';
import DynamicComponentMixin from '../rendering/mixins/dynamic-component';
import A2UIRenderer from '../rendering/renderer.vue';

export default Vue.extend({
  name: 'A2UIRow',

  mixins: [DynamicComponentMixin],

  components: {
    A2UIRenderer,
  },

  props: {
    alignment: {
      type: String as PropType<Types.ResolvedRow['alignment']>,
      default: 'stretch',
    },
    distribution: {
      type: String as PropType<Types.ResolvedRow['distribution']>,
      default: 'start',
    },
  },

  computed: {
    children(): Types.AnyComponentNode[] {
      return ((this as any).component as Types.RowNode).properties.children || [];
    },

    classes(): Record<string, boolean> {
      const theme = (this as any).theme as Types.Theme;
      return {
        ...theme.components.Row,
        [`align-${this.alignment}`]: true,
        [`distribute-${this.distribution}`]: true,
      };
    },
  },
});
</script>

<style>
.a2ui-row {
  display: flex;
  flex: var(--weight);
}

.a2ui-row > section {
  display: flex;
  flex-direction: row;
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
}

.a2ui-row .align-start {
  align-items: start;
}

.a2ui-row .align-center {
  align-items: center;
}

.a2ui-row .align-end {
  align-items: end;
}

.a2ui-row .align-stretch {
  align-items: stretch;
}

.a2ui-row .distribute-start {
  justify-content: start;
}

.a2ui-row .distribute-center {
  justify-content: center;
}

.a2ui-row .distribute-end {
  justify-content: end;
}

.a2ui-row .distribute-spaceBetween {
  justify-content: space-between;
}

.a2ui-row .distribute-spaceAround {
  justify-content: space-around;
}

.a2ui-row .distribute-spaceEvenly {
  justify-content: space-evenly;
}
</style>
