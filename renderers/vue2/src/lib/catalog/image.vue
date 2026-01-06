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
    class="a2ui-image"
    :class="classes"
    :style="[weightStyle, theme.additionalStyles && theme.additionalStyles.Image]"
  >
    <img
      v-if="resolvedUrl"
      :src="resolvedUrl"
      :style="imageStyle"
      alt=""
    />
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import type { Primitives, Types } from '@a2ui/lit/0.8';
import { Styles } from '@a2ui/lit/0.8';
import DynamicComponentMixin, { DynamicComponentVue } from '../rendering/mixins/dynamic-component';

export default DynamicComponentVue.extend({
  name: 'A2UIImage',

  mixins: [DynamicComponentMixin],

  props: {
    url: {
      type: Object as PropType<Primitives.StringValue | null>,
      required: true,
    },
    usageHint: {
      type: String as PropType<Types.ResolvedImage['usageHint'] | null>,
      default: null,
    },
    fit: {
      type: String as PropType<Types.ResolvedImage['fit'] | null>,
      default: null,
    },
  },

  computed: {
    resolvedUrl(): string | null {
      return this.resolvePrimitive(this.url) as string | null;
    },

    classes(): Record<string, boolean> {
      const usageHint = this.usageHint;

      return Styles.merge(
        this.theme.components.Image.all,
        usageHint ? this.theme.components.Image[usageHint as keyof typeof this.theme.components.Image] : {}
      );
    },

    imageStyle(): Record<string, string> {
      const fit = this.fit || 'contain';
      return {
        objectFit: fit,
        width: '100%',
        height: '100%',
      };
    },
  },
});
</script>

<style>
.a2ui-image {
  display: block;
  flex: var(--weight);
  overflow: hidden;
}

.a2ui-image img {
  display: block;
}
</style>
