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
    class="a2ui-audio"
    :class="theme.components.AudioPlayer"
    :style="[weightStyle, theme.additionalStyles && theme.additionalStyles.AudioPlayer]"
  >
    <audio
      v-if="resolvedUrl"
      :src="resolvedUrl"
      controls
    ></audio>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import type { PropType } from 'vue';
import type { Primitives, Types } from '@a2ui/lit/0.8';
import DynamicComponentMixin from '../rendering/mixins/dynamic-component';

export default Vue.extend({
  name: 'A2UIAudio',

  mixins: [DynamicComponentMixin],

  props: {
    url: {
      type: Object as PropType<Primitives.StringValue | null>,
      required: true,
    },
  },

  computed: {
    resolvedUrl(): string | null {
      return (this as any).resolvePrimitive(this.url);
    },
  },
});
</script>

<style>
.a2ui-audio {
  display: block;
  flex: var(--weight);
}

.a2ui-audio audio {
  width: 100%;
}
</style>
