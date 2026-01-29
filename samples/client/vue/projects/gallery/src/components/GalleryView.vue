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

interface GallerySample {
  id: string;
  title: string;
  description: string;
  surface: Types.Surface;
}

const dialog = ref<HTMLDialogElement | null>(null);
const selectedSample = ref<GallerySample | null>(null);

const samples = computed<GallerySample[]>(() => [
  {
    id: 'photo-list',
    title: 'List of items',
    description: 'List of items with images',
    surface: createSingleComponentSurface('Card', {
      child: createComponent('Column', {
        children: [
          createComponent('Row', {
            children: [
              createComponent('Image', {
                url: { literalString: 'https://picsum.photos/id/11/300/300' },
              }),
              createComponent('Column', {
                children: [
                  createComponent('Text', {
                    text: { literalString: 'A misty, serene natural landscape.' },
                  }),
                ],
              }),
            ],
          }),
          createComponent('Row', {
            children: [
              createComponent('Image', {
                url: { literalString: 'https://picsum.photos/id/12/300/300' },
              }),
              createComponent('Column', {
                children: [
                  createComponent('Text', {
                    text: { literalString: 'A river flows through marsh toward hazy, forested mountains.' },
                  }),
                ],
              }),
            ],
          }),
          createComponent('Row', {
            children: [
              createComponent('Image', {
                url: { literalString: 'https://picsum.photos/id/13/300/300' },
              }),
              createComponent('Text', {
                text: { literalString: 'Large dark rocks overlook sandy beach and ocean with distant islands.' },
              }),
            ],
          }),
        ],
      }),
    }),
  },
  {
    id: 'welcome',
    title: 'Welcome Card',
    description: 'A simple welcome card with an image and text.',
    surface: createSingleComponentSurface('Card', {
      child: createComponent('Column', {
        children: [
          createComponent('Image', {
            url: { literalString: 'https://picsum.photos/id/10/600/300' },
          }),
          createComponent('Text', {
            text: { literalString: 'Explore the possibilities of A2UI components with this interactive gallery.' },
          }),
          createComponent('Button', {
            action: { type: 'submit' },
            child: createComponent('Text', { text: { literalString: 'Get Started' } }),
          }),
        ],
        alignment: 'center',
      }),
    }),
  },
  {
    id: 'form',
    title: 'Contact Form',
    description: 'A sample contact form with validation.',
    surface: createSingleComponentSurface('Card', {
      child: createComponent('Column', {
        children: [
          createComponent('Row', {
            children: [
              createComponent('TextField', {
                label: { literalString: 'Name' },
                type: 'text',
                text: { literalString: '' },
              }),
            ],
          }),
          createComponent('Row', {
            children: [
              createComponent('TextField', {
                label: { literalString: 'Email Address' },
                type: 'email',
                text: { literalString: '' },
              }),
            ],
          }),
          createComponent('Row', {
            children: [
              createComponent('TextField', {
                label: { literalString: 'Message' },
                text: { literalString: '' },
              }),
            ],
          }),
          createComponent('Button', {
            action: { type: 'submit' },
            child: createComponent('Text', { text: { literalString: 'Send Message' } }),
          }),
        ],
      }),
    }),
  },
]);

function openDialog(sample: GallerySample) {
  selectedSample.value = sample;
  dialog.value?.showModal();
}

function closeDialog() {
  dialog.value?.close();
}
</script>

<template>
  <article class="widget-gallery">
    <article
      v-for="sample in samples"
      :key="sample.id"
      class="sample-widget"
      :id="'section-' + sample.id"
    >
      <section class="section-header">
        <div>
          <h3>{{ sample.title }}</h3>
          <p class="description">{{ sample.description }}</p>
        </div>
        <button class="json-toggle" @click="openDialog(sample)">
          Show JSON
        </button>
      </section>

      <div class="preview-card">
        <A2UISurface
          :surface-id="'gallery-' + sample.id"
          :surface="sample.surface"
        />
      </div>
    </article>
  </article>

  <dialog ref="dialog">
    <article v-if="selectedSample">
      <section class="section-header">
        <p class="section-title">{{ selectedSample.title }}</p>
        <button @click="closeDialog">Close</button>
      </section>
      <div class="dialog-content-grid">
        <section class="sample-surface">
          <A2UISurface
            :surface-id="'dialog-' + selectedSample.id"
            :surface="selectedSample.surface"
          />
        </section>
        <section class="json-pane">
          <pre>{{ getJson(selectedSample.surface) }}</pre>
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

.sample-widget {
  border: solid 1px;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  break-inside: avoid;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 1rem;
  background: white;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-weight: bold;
  font-size: 1.3rem;
  margin-top: 2px;
}

.widget-gallery {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  margin: 0 2em;
}

dialog .dialog-content-grid {
  flex-grow: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  height: 100%;
  align-items: stretch;
}

dialog .dialog-content-grid > .sample-surface {
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

.json-toggle {
  padding: 8px 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.json-toggle:hover {
  background: #f0f0f0;
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
