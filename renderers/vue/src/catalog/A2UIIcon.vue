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
  component: Types.IconNode;
  weight: string | number;
  name: Primitives.StringValue | null;
}>();

const { theme, resolvePrimitive } = useDynamicComponent(props);

const resolvedName = computed(() => resolvePrimitive(props.name));
</script>

<template>
  <a2ui-icon>
    <section v-if="resolvedName" :class="theme.components.Icon" :style="theme.additionalStyles?.Icon">
      <span class="g-icon">{{ resolvedName }}</span>
    </section>
  </a2ui-icon>
</template>

<style scoped>
a2ui-icon {
  display: block;
  flex: v-bind(props.weight);
  min-height: 0;
  overflow: auto;
}
</style>
