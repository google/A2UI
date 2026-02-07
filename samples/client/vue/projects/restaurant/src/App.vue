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
import { ref, computed, onUnmounted } from 'vue';
import { provideA2UI, DEFAULT_CATALOG, A2UISurface } from '@a2ui/vue';
import * as Types from '@a2ui/web_core/types/types';
import { useClient } from './client';
import { theme } from './theme';

// Provide A2UI configuration
provideA2UI({
  catalog: DEFAULT_CATALOG,
  theme,
});

const { isLoading, makeRequest, processor } = useClient();

const loadingTextIndex = ref(0);
const hasData = ref(false);
const inputValue = ref('Top 5 Chinese restaurants in New York.');

const loadingTextLines = [
  'Finding the best spots for you...',
  'Checking reviews...',
  'Looking for open tables...',
  'Almost there...',
];

let loadingInterval: number | undefined;

const surfaces = computed(() => {
  return Array.from(processor.getSurfaces());
});

async function handleSubmit(event: Event) {
  event.preventDefault();

  if (inputValue.value) {
    startLoadingAnimation();
    const message = inputValue.value as unknown as Types.A2UIClientEventMessage;
    await makeRequest(message);
    hasData.value = true;
    stopLoadingAnimation();
  }
}

function toggleTheme() {
  const { colorScheme } = window.getComputedStyle(document.body);
  const classList = document.body.classList;

  if (colorScheme === 'dark') {
    classList.add('light');
    classList.remove('dark');
  } else {
    classList.add('dark');
    classList.remove('light');
  }
}

function startLoadingAnimation() {
  loadingTextIndex.value = 0;

  loadingInterval = window.setInterval(() => {
    loadingTextIndex.value = (loadingTextIndex.value + 1) % loadingTextLines.length;
  }, 2000);
}

function stopLoadingAnimation() {
  if (loadingInterval) {
    clearInterval(loadingInterval);
    loadingInterval = undefined;
  }
}

onUnmounted(() => {
  stopLoadingAnimation();
});
</script>

<template>
  <div class="app">
    <!-- Loading state -->
    <div v-if="isLoading" class="pending">
      <div class="spinner"></div>
      <div class="loading-text">{{ loadingTextLines[loadingTextIndex] }}</div>
    </div>

    <!-- Form state -->
    <form v-else-if="!hasData" @submit="handleSubmit">
      <img class="hero-img" src="/hero.png" alt="Image of the restaurant" />

      <h1 class="app-title">Restaurant Finder</h1>
      <div>
        <input
          required
          v-model="inputValue"
          autocomplete="off"
          id="body"
          name="body"
          type="text"
          :disabled="isLoading"
        />
        <button type="submit" :disabled="isLoading">
          <span class="g-icon filled-heavy">send</span>
        </button>
      </div>
    </form>

    <!-- Results state -->
    <div v-else class="surfaces">
      <A2UISurface
        v-for="[surfaceId, surface] in surfaces"
        :key="surfaceId"
        :surface-id="surfaceId"
        :surface="surface"
      />
    </div>

    <button @click="toggleTheme" class="theme-toggle" ref="toggleButton">
      <span class="g-icon filled-heavy"></span>
    </button>
  </div>
</template>

<style scoped>
.app {
  display: block;
  max-width: 640px;
  margin: 0 auto;
  min-height: 100%;
  color: light-dark(var(--n-10), var(--n-90));
  font-family: var(--font-family);
}

.hero-img {
  width: 100%;
  max-width: 400px;
  aspect-ratio: 1280/720;
  height: auto;
  margin-bottom: var(--bb-grid-size-6);
  display: block;
  margin: 0 auto;
}

.surfaces {
  width: 100%;
  max-width: 100svw;
  padding: var(--bb-grid-size-3);
  animation: fadeIn 1s cubic-bezier(0, 0, 0.3, 1) 0.3s backwards;
}

form {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 16px;
  align-items: center;
  padding: 16px 0;
  animation: fadeIn 1s cubic-bezier(0, 0, 0.3, 1) 1s backwards;
}

form h1 {
  color: light-dark(var(--p-40), var(--n-90));
}

form > div {
  display: flex;
  flex: 1;
  gap: 16px;
  align-items: center;
  width: 100%;
}

form > div > input {
  display: block;
  flex: 1;
  border-radius: 32px;
  padding: 16px 24px;
  border: 1px solid var(--p-60);
  background: light-dark(var(--n-100), var(--n-10));
  font-size: 16px;
}

form > div > button {
  display: flex;
  align-items: center;
  background: var(--p-40);
  color: var(--n-100);
  border: none;
  padding: 8px 16px;
  border-radius: 32px;
  opacity: 0.5;
  cursor: pointer;
}

form > div > button:not([disabled]) {
  opacity: 1;
}

.pending {
  width: 100%;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  animation: fadeIn 1s cubic-bezier(0, 0, 0.3, 1) 0.3s backwards;
  gap: 16px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-left-color: var(--p-60);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.theme-toggle {
  padding: 0;
  margin: 0;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: var(--bb-grid-size-3);
  right: var(--bb-grid-size-4);
  background: light-dark(var(--n-100), var(--n-0));
  border-radius: 50%;
  color: var(--p-30);
  cursor: pointer;
  width: 48px;
  height: 48px;
  font-size: 32px;
}

.theme-toggle .g-icon {
  pointer-events: none;
}

.theme-toggle .g-icon::before {
  content: "dark_mode";
}

.g-icon {
  font-family: "Material Symbols Outlined", "Google Symbols";
  font-weight: normal;
  font-style: normal;
  font-display: optional;
  font-size: 20px;
  width: 1em;
  height: 1em;
  user-select: none;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-feature-settings: "liga";
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
  font-variation-settings: "FILL" 0, "wght" 300, "GRAD" 0, "opsz" 48, "ROND" 100;
}

.g-icon.filled {
  font-variation-settings: "FILL" 1, "wght" 300, "GRAD" 0, "opsz" 48, "ROND" 100;
}

.g-icon.filled-heavy {
  font-variation-settings: "FILL" 1, "wght" 700, "GRAD" 0, "opsz" 48, "ROND" 100;
}

@container style(--color-scheme: dark) {
  .theme-toggle .g-icon::before {
    content: "light_mode";
    color: var(--n-90);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
