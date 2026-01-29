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
import * as Types from '@a2ui/web_core/types/types';
import { useDynamicComponent } from '@/rendering/useDynamicComponent';

const props = defineProps<{
  surfaceId: Types.SurfaceID | null;
  component: Types.VideoNode;
  weight: string | number;
  url: Primitives.StringValue | null;
}>();

const { theme, resolvePrimitive } = useDynamicComponent(props);

const resolvedUrl = computed(() => resolvePrimitive(props.url));
</script>

<template>
  <a2ui-video>
    <section v-if="resolvedUrl" :class="theme.components.Video" :style="theme.additionalStyles?.Video">
      <video controls :src="resolvedUrl" />
    </section>
  </a2ui-video>
</template>

<style scoped>
a2ui-video {
  display: block;
  flex: v-bind(props.weight);
  min-height: 0;
  overflow: auto;
}

video {
  display: block;
  width: 100%;
  box-sizing: border-box;
}
</style>
