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
  <div class="a2ui-button" :style="weightStyle">
    <button
      :class="theme.components.Button"
      :style="theme.additionalStyles && theme.additionalStyles.Button"
      @click="handleClick"
    >
      <A2UIRenderer
        :surface-id="surfaceId"
        :component="buttonNode.properties.child"
      />
    </button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import type { PropType } from 'vue';
import type { Types } from '@a2ui/lit/0.8';
import DynamicComponentMixin from '../rendering/mixins/dynamic-component';
import A2UIRenderer from '../rendering/renderer.vue';

export default Vue.extend({
  name: 'A2UIButton',

  mixins: [DynamicComponentMixin],

  components: {
    A2UIRenderer,
  },

  props: {
    action: {
      type: Object as PropType<Types.Action | null>,
      default: null,
    },
  },

  computed: {
    buttonNode(): Types.ButtonNode {
      return (this as any).component as Types.ButtonNode;
    },
  },

  methods: {
    handleClick() {
      if (this.action) {
        (this as any).sendAction(this.action);
      }
    },
  },
});
</script>

<style>
.a2ui-button {
  display: block;
  flex: var(--weight);
  min-height: 0;
}
</style>
