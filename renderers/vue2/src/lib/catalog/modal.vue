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
  <div class="a2ui-modal" :style="weightStyle">
    <!-- Modal dialog when open -->
    <dialog
      v-if="showDialog"
      ref="dialog"
      :class="theme.components.Modal.backdrop"
      @click="handleDialogClick"
    >
      <section
        :class="theme.components.Modal.element"
        :style="theme.additionalStyles && theme.additionalStyles.Modal"
      >
        <div class="a2ui-modal__controls">
          <button @click="closeDialog">
            <span class="g-icon">close</span>
          </button>
        </div>

        <A2UIRenderer
          :surface-id="surfaceId"
          :component="modalNode.properties.contentChild"
        />
      </section>
    </dialog>

    <!-- Entry point (trigger) when closed -->
    <section v-else @click="openDialog">
      <A2UIRenderer
        :surface-id="surfaceId"
        :component="modalNode.properties.entryPointChild"
      />
    </section>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import type { Types } from '@a2ui/lit/0.8';
import DynamicComponentMixin from '../rendering/mixins/dynamic-component';
import A2UIRenderer from '../rendering/renderer.vue';

export default Vue.extend({
  name: 'A2UIModal',

  mixins: [DynamicComponentMixin],

  components: {
    A2UIRenderer,
  },

  data() {
    return {
      showDialog: false,
    };
  },

  computed: {
    modalNode(): Types.ModalNode {
      return (this as any).component as Types.ModalNode;
    },
  },

  watch: {
    showDialog(newValue: boolean) {
      if (newValue) {
        this.$nextTick(() => {
          const dialog = this.$refs.dialog as HTMLDialogElement | undefined;
          if (dialog && !dialog.open) {
            dialog.showModal();
          }
        });
      }
    },
  },

  methods: {
    openDialog() {
      this.showDialog = true;
    },

    closeDialog() {
      const dialog = this.$refs.dialog as HTMLDialogElement | undefined;
      if (dialog?.open) {
        dialog.close();
      }
      this.showDialog = false;
    },

    handleDialogClick(event: MouseEvent) {
      // Close when clicking the backdrop (the dialog element itself)
      if (event.target instanceof HTMLDialogElement) {
        this.closeDialog();
      }
    },
  },
});
</script>

<style>
.a2ui-modal {
  display: block;
  flex: var(--weight);
}

.a2ui-modal dialog {
  padding: 0;
  border: none;
  background: none;
}

.a2ui-modal__controls {
  display: flex;
  justify-content: end;
  margin-bottom: 4px;
}

.a2ui-modal__controls button {
  padding: 0;
  background: none;
  width: 20px;
  height: 20px;
  border: none;
  cursor: pointer;
}
</style>
