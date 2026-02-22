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
import { ref, watch, nextTick } from 'vue';
import * as Types from '@a2ui/web_core/types/types';
import { useDynamicComponent } from '@/rendering/useDynamicComponent';
import A2UiRenderer from '@/rendering/A2UIRenderer.vue';

const props = defineProps<{
  surfaceId: Types.SurfaceID | null;
  component: Types.ModalNode;
  weight: string | number;
}>();

const { theme } = useDynamicComponent(props);

const showDialog = ref(false);
const dialogRef = ref<HTMLDialogElement | null>(null);

watch(showDialog, async (show) => {
  if (show) {
    await nextTick();
    dialogRef.value?.showModal();
  }
});

function handleDialogClick(event: MouseEvent) {
  if (event.target instanceof HTMLDialogElement) {
    closeDialog();
  }
}

function closeDialog() {
  if (dialogRef.value?.open) {
    dialogRef.value.close();
  }
  showDialog.value = false;
}
</script>

<template>
  <dialog
      v-if="showDialog"
      ref="dialogRef"
      :class="theme.components.Modal.backdrop"
      @click="handleDialogClick"
  >
    <section :class="theme.components.Modal.element" :style="theme.additionalStyles?.Modal">
      <div class="controls">
        <button @click="closeDialog">
          <span class="g-icon">close</span>
        </button>
      </div>

      <A2UiRenderer
          :surface-id="surfaceId!"
          :component="component.properties.contentChild"
      />
    </section>
  </dialog>
  <a2ui-modal>
    <section  @click="showDialog = true">
      <A2UiRenderer
          :surface-id="surfaceId!"
          :component="component.properties.entryPointChild"
        />
    </section>
  </a2ui-modal>
</template>

<style scoped>
dialog {
  padding: 0;
  border: none;
  background: none;
}

dialog section .controls {
  display: flex;
  justify-content: end;
  margin-bottom: 4px;
}

dialog section .controls button {
  padding: 0;
  background: none;
  width: 20px;
  height: 20px;
  border: none;
  cursor: pointer;
}
</style>
