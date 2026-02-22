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
import * as Types from '@a2ui/web_core/types/types';
import { useDynamicComponent } from '@/rendering/useDynamicComponent';
import A2UIRenderer from '@/rendering/A2UIRenderer.vue';

const props = defineProps<{
  surfaceId: Types.SurfaceID | null;
  component: Types.ButtonNode;
  weight: string | number;
  action: Types.Action | null;
}>();

const { theme, sendAction } = useDynamicComponent(props);

function handleClick() {
  if (props.action) {
    sendAction(props.action);
  }
}
</script>

<template>
  <a2ui-button>
    <button
      :class="theme.components.Button"
      :style="theme.additionalStyles?.Button"
      @click="handleClick"
    >
      <A2UIRenderer
        :surface-id="surfaceId!"
        :component="component.properties.child"
      />
    </button>
  </a2ui-button>
</template>

<style scoped>
a2ui-button {
  display: block;
  flex: v-bind(weight);
  min-height: 0;
}
</style>
