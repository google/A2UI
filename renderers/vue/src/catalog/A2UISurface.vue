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
import { computed, type CSSProperties } from 'vue';
import * as Types from '@a2ui/web_core/types/types';
import A2UiRenderer from '@/rendering/A2UIRenderer.vue';

const props = defineProps<{
  surfaceId: Types.SurfaceID | null;
  surface: Types.Surface | null;
}>();

const styles = computed<CSSProperties>(() => {
  const surface = props.surface;
  const result: CSSProperties = {};

  if (surface?.styles) {
    for (const [key, value] of Object.entries(surface.styles)) {
      switch (key) {
        case 'primaryColor': {
          (result as any)['--p-100'] = '#ffffff';
          (result as any)['--p-99'] = `color-mix(in srgb, ${value} 2%, white 98%)`;
          (result as any)['--p-98'] = `color-mix(in srgb, ${value} 4%, white 96%)`;
          (result as any)['--p-95'] = `color-mix(in srgb, ${value} 10%, white 90%)`;
          (result as any)['--p-90'] = `color-mix(in srgb, ${value} 20%, white 80%)`;
          (result as any)['--p-80'] = `color-mix(in srgb, ${value} 40%, white 60%)`;
          (result as any)['--p-70'] = `color-mix(in srgb, ${value} 60%, white 40%)`;
          (result as any)['--p-60'] = `color-mix(in srgb, ${value} 80%, white 20%)`;
          (result as any)['--p-50'] = value;
          (result as any)['--p-40'] = `color-mix(in srgb, ${value} 80%, black 20%)`;
          (result as any)['--p-35'] = `color-mix(in srgb, ${value} 70%, black 30%)`;
          (result as any)['--p-30'] = `color-mix(in srgb, ${value} 60%, black 40%)`;
          (result as any)['--p-25'] = `color-mix(in srgb, ${value} 50%, black 50%)`;
          (result as any)['--p-20'] = `color-mix(in srgb, ${value} 40%, black 60%)`;
          (result as any)['--p-15'] = `color-mix(in srgb, ${value} 30%, black 70%)`;
          (result as any)['--p-10'] = `color-mix(in srgb, ${value} 20%, black 80%)`;
          (result as any)['--p-5'] = `color-mix(in srgb, ${value} 10%, black 90%)`;
          (result as any)['--0'] = '#00000';
          break;
        }

        case 'font': {
          (result as any)['--font-family'] = value;
          (result as any)['--font-family-flex'] = value;
          break;
        }
      }
    }
  }

  return result;
});
</script>

<template>
  <a2ui-surface  :style="styles">
    <A2UiRenderer
      v-if="surfaceId && surface?.componentTree"
      :surface-id="surfaceId"
      :component="surface.componentTree"
    />
  </a2ui-surface>
</template>

<style scoped>
a2ui-surface {
  display: flex;
  min-height: 0;
  max-height: 100%;
  flex-direction: column;
  gap: 16px;
}
</style>
