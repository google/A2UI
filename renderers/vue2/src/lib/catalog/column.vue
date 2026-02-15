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
  <div class="a2ui-column" :style="weightStyle">
    <section
      :class="classes"
      :style="theme.additionalStyles && theme.additionalStyles.Column"
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
import type { PropType } from 'vue';
import type { Types } from '@a2ui/lit/0.8';
import DynamicComponentMixin, { DynamicComponentVue } from '../rendering/mixins/dynamic-component';
import A2UIRenderer from '../rendering/renderer.vue';

export default DynamicComponentVue.extend({
  name: 'A2UIColumn',

  mixins: [DynamicComponentMixin],

  components: {
    A2UIRenderer,
  },

  props: {
    alignment: {
      type: String as PropType<Types.ResolvedColumn['alignment']>,
      default: 'stretch',
    },
    distribution: {
      type: String as PropType<Types.ResolvedColumn['distribution']>,
      default: 'start',
    },
  },

  computed: {
    children(): Types.AnyComponentNode[] {
      return (this.component as Types.ColumnNode).properties.children || [];
    },

    classes(): Record<string, boolean> {
      return {
        ...this.theme.components.Column,
        [`align-${this.alignment}`]: true,
        [`distribute-${this.distribution}`]: true,
      };
    },
  },
});
</script>

<style>
.a2ui-column {
  display: flex;
  flex: var(--weight);
}

.a2ui-column > section {
  display: flex;
  flex-direction: column;
  min-width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.a2ui-column .align-start {
  align-items: start;
}

.a2ui-column .align-center {
  align-items: center;
}

.a2ui-column .align-end {
  align-items: end;
}

.a2ui-column .align-stretch {
  align-items: stretch;
}

.a2ui-column .distribute-start {
  justify-content: start;
}

.a2ui-column .distribute-center {
  justify-content: center;
}

.a2ui-column .distribute-end {
  justify-content: end;
}

.a2ui-column .distribute-spaceBetween {
  justify-content: space-between;
}

.a2ui-column .distribute-spaceAround {
  justify-content: space-around;
}

.a2ui-column .distribute-spaceEvenly {
  justify-content: space-evenly;
}
</style>
