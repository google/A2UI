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
import { ref, computed } from 'vue';
import { A2UISurface } from '@a2ui/vue';
import * as Types from '@a2ui/web_core/types/types';
import { createSingleComponentSurface, createComponent, getJson } from '@/utils/surface';

interface Block {
  name: string;
  tag: string;
  surface: Types.Surface;
}

const dialog = ref<HTMLDialogElement | null>(null);
const selectedBlock = ref<Block | null>(null);

const blocks = computed<Block[]>(() => [
  // Layout Components
  {
    name: 'Card',
    tag: 'Layout',
    surface: createSingleComponentSurface('Card', {
      child: createComponent('Text', { text: { literalString: 'Content inside a card' } }),
    }),
  },
  {
    name: 'Column',
    tag: 'Layout',
    surface: createSingleComponentSurface('Column', {
      children: [
        createComponent('Text', { text: { literalString: 'Item 1' } }),
        createComponent('Text', { text: { literalString: 'Item 2' } }),
        createComponent('Text', { text: { literalString: 'Item 3' } }),
      ],
      alignment: 'center',
      distribution: 'space-around',
    }),
  },
  {
    name: 'Divider',
    tag: 'Layout',
    surface: createSingleComponentSurface('Column', {
      children: [
        createComponent('Text', { text: { literalString: 'Above Divider' } }),
        createComponent('Divider', {}),
        createComponent('Text', { text: { literalString: 'Below Divider' } }),
      ],
    }),
  },
  {
    name: 'List',
    tag: 'Layout',
    surface: createSingleComponentSurface('List', {
      children: [
        createComponent('Text', { text: { literalString: 'List Item 1' } }),
        createComponent('Text', { text: { literalString: 'List Item 2' } }),
        createComponent('Text', { text: { literalString: 'List Item 3' } }),
      ],
      direction: 'vertical',
    }),
  },
  {
    name: 'Modal',
    tag: 'Layout',
    surface: createSingleComponentSurface('Modal', {
      entryPointChild: createComponent('Button', {
        action: { type: 'none' },
        child: createComponent('Text', { text: { literalString: 'Open Modal' } }),
      }),
      contentChild: createComponent('Card', {
        child: createComponent('Text', {
          text: { literalString: 'This is the modal content.' },
        }),
      }),
    }),
  },
  {
    name: 'Row',
    tag: 'Layout',
    surface: createSingleComponentSurface('Row', {
      children: [
        createComponent('Text', { text: { literalString: 'Left' } }),
        createComponent('Text', { text: { literalString: 'Center' } }),
        createComponent('Text', { text: { literalString: 'Right' } }),
      ],
      alignment: 'center',
      distribution: 'space-between',
    }),
  },
  {
    name: 'Tabs',
    tag: 'Layout',
    surface: createSingleComponentSurface('Tabs', {
      tabItems: [
        {
          title: { literalString: 'Tab 1' },
          child: createComponent('Text', { text: { literalString: 'Content for Tab 1' } }),
        },
        {
          title: { literalString: 'Tab 2' },
          child: createComponent('Text', { text: { literalString: 'Content for Tab 2' } }),
        },
      ],
    }),
  },
  {
    name: 'Text',
    tag: 'Layout',
    surface: createSingleComponentSurface('Column', {
      children: [
        createComponent('Heading', { text: { literalString: 'Heading Text' } }),
        createComponent('Text', { text: { literalString: 'Standard body text.' } }),
        createComponent('Text', {
          text: { literalString: 'Caption text' },
          usageHint: 'caption',
        }),
      ],
    }),
  },

  // Media Components
  {
    name: 'AudioPlayer',
    tag: 'Media',
    surface: createSingleComponentSurface('AudioPlayer', {
      url: { literalString: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    }),
  },
  {
    name: 'Icon',
    tag: 'Media',
    surface: createSingleComponentSurface('Row', {
      children: [
        createComponent('Icon', { name: { literalString: 'home' } }),
        createComponent('Icon', { name: { literalString: 'favorite' } }),
        createComponent('Icon', { name: { literalString: 'settings' } }),
      ],
      distribution: 'space-around',
    }),
  },
  {
    name: 'Image',
    tag: 'Media',
    surface: createSingleComponentSurface('Image', {
      url: { literalString: 'https://picsum.photos/id/10/300/200' },
    }),
  },
  {
    name: 'Video',
    tag: 'Media',
    surface: createSingleComponentSurface('Video', {
      url: {
        literalString: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      },
    }),
  },

  // Input Components
  {
    name: 'Button',
    tag: 'Inputs',
    surface: createSingleComponentSurface('Row', {
      children: [
        createComponent('Button', {
          label: { literalString: 'Primary' },
          action: { type: 'click' },
          child: createComponent('Text', { text: { literalString: 'Primary' } }),
        }),
        createComponent('Button', {
          label: { literalString: 'Secondary' },
          action: { type: 'click' },
          child: createComponent('Text', { text: { literalString: 'Secondary' } }),
        }),
      ],
      distribution: 'space-around',
    }),
  },
  {
    name: 'CheckBox',
    tag: 'Inputs',
    surface: createSingleComponentSurface('Column', {
      children: [
        createComponent('CheckBox', {
          label: { literalString: 'Unchecked' },
          value: { literalBoolean: false },
        }),
        createComponent('CheckBox', {
          label: { literalString: 'Checked' },
          value: { literalBoolean: true },
        }),
      ],
    }),
  },
  {
    name: 'DateTimeInput',
    tag: 'Inputs',
    surface: createSingleComponentSurface('Column', {
      children: [
        createComponent('DateTimeInput', {
          enableDate: true,
          enableTime: false,
          value: { literalString: '2025-12-09' },
        }),
        createComponent('DateTimeInput', {
          enableDate: true,
          enableTime: true,
          value: { literalString: '2025-12-09T12:00:00' },
        }),
      ],
    }),
  },
  {
    name: 'MultipleChoice',
    tag: 'Inputs',
    surface: createSingleComponentSurface('MultipleChoice', {
      options: [
        { value: 'opt1', label: { literalString: 'Option 1' } },
        { value: 'opt2', label: { literalString: 'Option 2' } },
        { value: 'opt3', label: { literalString: 'Option 3' } },
      ],
      selections: { literalString: 'opt1' },
    }),
  },
  {
    name: 'Slider',
    tag: 'Inputs',
    surface: createSingleComponentSurface('Slider', {
      value: { literalNumber: 50 },
      minValue: 0,
      maxValue: 100,
    }),
  },
  {
    name: 'TextField',
    tag: 'Inputs',
    surface: createSingleComponentSurface('Column', {
      children: [
        createComponent('TextField', {
          label: { literalString: 'Standard Input' },
          text: { literalString: 'Some text' },
        }),
        createComponent('TextField', {
          label: { literalString: 'Password' },
          type: 'password',
          text: { literalString: '' },
        }),
      ],
    }),
  },
]);

function openDialog(block: Block) {
  selectedBlock.value = block;
  dialog.value?.showModal();
}

function closeDialog() {
  dialog.value?.close();
}
</script>

<template>
  <section class="block-gallery">
    <article
      v-for="block in blocks"
      :key="block.name"
      class="block-card"
      @click="openDialog(block)"
    >
      <section class="block-header">
        <p class="block-title">{{ block.name }}</p>
      </section>
      <A2UISurface :surface-id="'lib-' + block.name" :surface="block.surface" />
    </article>
  </section>

  <dialog ref="dialog">
    <article v-if="selectedBlock">
      <section class="block-header">
        <p class="block-title">{{ selectedBlock.name }}</p>
        <button @click="closeDialog">Close</button>
      </section>
      <div class="dialog-content-grid">
        <section class="block-surface">
          <A2UISurface
            :surface-id="'dialog-' + selectedBlock.name"
            :surface="selectedBlock.surface"
          />
        </section>
        <section class="json-pane">
          <pre>{{ getJson(selectedBlock.surface) }}</pre>
        </section>
      </div>
    </article>
    <article v-else>
      <h3>Please select a component from the gallery</h3>
    </article>
  </dialog>
</template>

<style scoped>
dialog {
  min-width: 800px;
  min-height: 600px;
  padding: 1rem;
  border-radius: 8px;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
  transition:
    opacity 0.2s ease-out,
    transform 0.2s ease-out;
  display: flex;
  flex-direction: column;
}

dialog[open] {
  opacity: 1;
  transform: translateY(0) scale(1);
  animation: slide-in 0.2s ease-out forwards;
}

dialog::backdrop {
  opacity: 0;
  background-color: rgba(0, 0, 0, 0.5);
  transition: opacity 0.2s ease-out;
}

dialog[open]::backdrop {
  opacity: 1;
  animation: fade-in 0.2s ease-out forwards;
}

dialog article {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.block-card {
  border: solid 1px;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  break-inside: avoid;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 1rem;
  background: white;
  cursor: pointer;
}

.block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.block-title {
  font-weight: bold;
  font-size: 1.3rem;
  margin-top: 2px;
}

.block-gallery {
  margin: 0 2rem 0 2rem;
  column-width: 320px;
  column-gap: 1rem;
}

dialog .dialog-content-grid {
  flex-grow: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  height: 100%;
  align-items: stretch;
}

dialog .dialog-content-grid > .block-surface {
  margin-right: 10px;
  height: 100%;
}

.json-pane {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.json-pane pre {
  background-color: #272822;
  color: #f8f8f2;
  padding: 1em;
  border-radius: 4px;
  flex-grow: 1;
  overflow: auto;
  height: 100%;
  white-space: pre-wrap;
  word-break: break-word;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
