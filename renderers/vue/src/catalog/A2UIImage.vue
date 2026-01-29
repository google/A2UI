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

<script setup lang="ts">
import { computed } from 'vue';
import * as Primitives from '@a2ui/web_core/types/primitives';
import * as Styles from '@a2ui/web_core/styles/index';
import * as Types from '@a2ui/web_core/types/types';
import { useDynamicComponent } from '@/rendering/useDynamicComponent';

const props = defineProps<{
  surfaceId: Types.SurfaceID | null;
  component: Types.ImageNode;
  weight: string | number;
  url: Primitives.StringValue | null;
  usageHint: Types.ResolvedImage['usageHint'] | null;
}>();

const { theme, resolvePrimitive } = useDynamicComponent(props);

const resolvedUrl = computed(() => resolvePrimitive(props.url));

const classes = computed(() => {
  const usageHint = props.usageHint;

  return Styles.merge(
    theme.components.Image.all,
    usageHint ? theme.components.Image[usageHint] : {},
  );
});
</script>

<template>
  <a2ui-image>
    <section v-if="resolvedUrl" :class="classes" :style="theme.additionalStyles?.Image">
      <img :src="resolvedUrl" />
    </section>
  </a2ui-image>
</template>

<style scoped>
a2ui-image {
  display: block;
  flex: v-bind(props.weight);
  min-height: 0;
  overflow: auto;
}

img {
  display: block;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}
</style>
