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
    v-if="surfaceId && surface && surface.componentTree"
    class="a2ui-surface"
    :style="surfaceStyles"
  >
    <A2UIRenderer
      :surface-id="surfaceId"
      :component="surface.componentTree"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import type { PropType } from 'vue';
import type { Types } from '@a2ui/lit/0.8';
import A2UIRenderer from '../rendering/renderer.vue';

export default Vue.extend({
  name: 'A2UISurface',

  components: {
    A2UIRenderer,
  },

  props: {
    surfaceId: {
      type: String as PropType<Types.SurfaceID | null>,
      required: true,
    },
    surface: {
      type: Object as PropType<Types.Surface | null>,
      required: true,
    },
  },

  computed: {
    surfaceStyles(): Record<string, string> {
      const styles: Record<string, string> = {};
      const surfaceData = this.surface;

      if (surfaceData?.styles) {
        for (const [key, value] of Object.entries(surfaceData.styles)) {
          switch (key) {
            case 'primaryColor': {
              // Generate color palette from primary color
              styles['--p-100'] = '#ffffff';
              styles['--p-99'] = `color-mix(in srgb, ${value} 2%, white 98%)`;
              styles['--p-98'] = `color-mix(in srgb, ${value} 4%, white 96%)`;
              styles['--p-95'] = `color-mix(in srgb, ${value} 10%, white 90%)`;
              styles['--p-90'] = `color-mix(in srgb, ${value} 20%, white 80%)`;
              styles['--p-80'] = `color-mix(in srgb, ${value} 40%, white 60%)`;
              styles['--p-70'] = `color-mix(in srgb, ${value} 60%, white 40%)`;
              styles['--p-60'] = `color-mix(in srgb, ${value} 80%, white 20%)`;
              styles['--p-50'] = value;
              styles['--p-40'] = `color-mix(in srgb, ${value} 80%, black 20%)`;
              styles['--p-35'] = `color-mix(in srgb, ${value} 70%, black 30%)`;
              styles['--p-30'] = `color-mix(in srgb, ${value} 60%, black 40%)`;
              styles['--p-25'] = `color-mix(in srgb, ${value} 50%, black 50%)`;
              styles['--p-20'] = `color-mix(in srgb, ${value} 40%, black 60%)`;
              styles['--p-15'] = `color-mix(in srgb, ${value} 30%, black 70%)`;
              styles['--p-10'] = `color-mix(in srgb, ${value} 20%, black 80%)`;
              styles['--p-5'] = `color-mix(in srgb, ${value} 10%, black 90%)`;
              styles['--p-0'] = '#000000';
              break;
            }

            case 'font': {
              styles['--font-family'] = value;
              styles['--font-family-flex'] = value;
              break;
            }
          }
        }
      }

      return styles;
    },
  },
});
</script>

<style>
.a2ui-surface {
  display: flex;
  min-height: 0;
  max-height: 100%;
  flex-direction: column;
  gap: 16px;
}
</style>
